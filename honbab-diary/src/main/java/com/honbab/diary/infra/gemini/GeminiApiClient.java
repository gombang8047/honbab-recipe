package com.honbab.diary.infra.gemini;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import com.honbab.diary.global.exception.BusinessException;
import com.honbab.diary.global.exception.ErrorCode;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

@Slf4j
@Component
@RequiredArgsConstructor
public class GeminiApiClient {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${gemini.api-key:AQ.Ab8RN6KWyU73mCyuABcXGRvFW8mgDv3ZnmHGNIUU4tTMaHXNQQ}")
    private String apiKey;

    private static final List<String> CANDIDATE_MODELS = List.of(
            "gemini-3.5-flash-lite",
            "gemini-3.1-flash-lite",
            "gemini-3.5-flash"
    );

    private static final String GEMINI_URL_TEMPLATE =
            "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s";
    private static final String YOUTUBE_WATCH_URL_TEMPLATE =
            "https://www.youtube.com/watch?v=%s";
    private static final Pattern YOUTUBE_ID_PATTERN = Pattern.compile("^[A-Za-z0-9_-]{11}$");

    /**
     * Gemini AI로 공개 유튜브 영상과 제목/설명/태그/댓글을 함께 분석하여 레시피 JSON 생성.
     * 영상 분석이 지원되지 않거나 실패하면 기존 텍스트 분석으로 자동 전환한다.
     */
    public String generateRecipeJson(String prompt, String youtubeId, String fallbackTitle) {
        validateApiKey();

        Exception lastException = null;
        String youtubeUrl = buildYoutubeUrl(youtubeId);

        if (youtubeUrl != null) {
            for (String modelName : CANDIDATE_MODELS) {
                try {
                    return requestRecipe(modelName, prompt, youtubeUrl, youtubeId, fallbackTitle);
                } catch (Exception e) {
                    lastException = e;
                    log.warn("Gemini 영상 분석 실패, 다음 모델 시도: model={}, youtubeId={}, error={}",
                            modelName, youtubeId, e.getMessage());
                }
            }

            log.warn("모든 Gemini 영상 분석 호출 실패. 텍스트 기반 분석으로 전환합니다. youtubeId={}", youtubeId);
        } else {
            log.warn("유효한 YouTube ID가 없어 텍스트 기반 분석으로 진행합니다. youtubeId={}", youtubeId);
        }

        for (String modelName : CANDIDATE_MODELS) {
            try {
                return requestRecipe(modelName, prompt, null, youtubeId, fallbackTitle);
            } catch (Exception e) {
                lastException = e;
                log.warn("Gemini 텍스트 분석 실패, 다음 모델 시도: model={}, youtubeId={}, error={}",
                        modelName, youtubeId, e.getMessage());
            }
        }

        log.error("모든 Gemini 모델 호출 실패: {}", lastException != null ? lastException.getMessage() : "응답 없음");
        throw new BusinessException(ErrorCode.AI_CONVERSION_FAILED, "Gemini AI 레시피 변환에 실패했습니다: " + (lastException != null ? lastException.getMessage() : "쿼터 초과"));
    }

    /**
     * 동일 입력을 VIDEO/TEXT 모드로 분리해 비교하기 위한 평가 전용 진입점.
     * 운영 변환처럼 다른 입력 모드로 폴백하지 않으므로 두 방식의 성공률과 시간을 독립적으로 측정한다.
     */
    String generateRecipeJsonForEvaluation(
            String prompt,
            String youtubeId,
            String fallbackTitle,
            boolean includeVideo
    ) {
        validateApiKey();
        String youtubeUrl = includeVideo ? buildYoutubeUrl(youtubeId) : null;
        if (includeVideo && youtubeUrl == null) {
            throw new IllegalArgumentException("영상 평가에 사용할 수 없는 YouTube ID입니다: " + youtubeId);
        }

        Exception lastException = null;
        for (String modelName : CANDIDATE_MODELS) {
            try {
                return requestRecipe(modelName, prompt, youtubeUrl, youtubeId, fallbackTitle);
            } catch (Exception e) {
                lastException = e;
                log.warn("Gemini 평가 호출 실패, 다음 모델 시도: mode={}, model={}, youtubeId={}, error={}",
                        includeVideo ? "VIDEO" : "TEXT", modelName, youtubeId, e.getMessage());
            }
        }

        throw new BusinessException(
                ErrorCode.AI_CONVERSION_FAILED,
                "Gemini 평가 호출에 실패했습니다: "
                        + (lastException != null ? lastException.getMessage() : "응답 없음")
        );
    }

    private void validateApiKey() {
        if (apiKey == null || apiKey.isBlank() || "MOCK_KEY".equalsIgnoreCase(apiKey)) {
            log.error("Gemini API Key 미설정: AI 레시피 변환 불가");
            throw new BusinessException(ErrorCode.AI_CONVERSION_FAILED, "Gemini API 키가 설정되지 않았습니다.");
        }
    }

    // Keep both prompt variants on one model; fallback would confound the comparison.
    GenerationMeasurement generateVideoForPromptBenchmark(String prompt, String youtubeId, String title) throws Exception {
        validateApiKey();
        String youtubeUrl = buildYoutubeUrl(youtubeId);
        if (youtubeUrl == null) throw new IllegalArgumentException("유효한 YouTube ID가 필요합니다.");
        return requestRecipeMeasured(CANDIDATE_MODELS.get(0), prompt, youtubeUrl, youtubeId, title);
    }

    record GenerationMeasurement(String json, String model, Integer inputTokens, Integer outputTokens,
                                 Integer thoughtTokens, Integer totalTokens, String finishReason) {}

    private static Integer tokenCount(JsonNode usage, String field) {
        return usage.hasNonNull(field) ? usage.path(field).intValue() : null;
    }

    private String requestRecipe(
            String modelName,
            String prompt,
            String youtubeUrl,
            String youtubeId,
            String fallbackTitle
    ) throws Exception {
        return requestRecipeMeasured(modelName, prompt, youtubeUrl, youtubeId, fallbackTitle).json();
    }

    private GenerationMeasurement requestRecipeMeasured(
            String modelName, String prompt, String youtubeUrl, String youtubeId, String fallbackTitle
    ) throws Exception {
        String url = String.format(GEMINI_URL_TEMPLATE, modelName, apiKey);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        List<Map<String, Object>> parts = new ArrayList<>();
        if (youtubeUrl != null) {
            parts.add(Map.of("file_data", Map.of("file_uri", youtubeUrl)));
        }
        parts.add(Map.of("text", prompt));

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(Map.of("parts", parts)),
                "generationConfig", Map.of(
                        "responseMimeType", "application/json",
                        "temperature", 0.2
                )
        );

        String analysisMode = youtubeUrl == null ? "TEXT" : "VIDEO";
        log.info("Gemini ({}) 레시피 분석 API 호출 시작: mode={}, youtubeId={}, title={}",
                modelName, analysisMode, youtubeId, fallbackTitle);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
        String result = extractResponseText(response);

        log.info("Gemini ({}) AI 레시피 추출 성공: mode={}, youtubeId={}", modelName, analysisMode, youtubeId);
        JsonNode root = objectMapper.readTree(response.getBody());
        JsonNode usage = root.path("usageMetadata");
        return new GenerationMeasurement(result, modelName,
                tokenCount(usage, "promptTokenCount"), tokenCount(usage, "candidatesTokenCount"),
                tokenCount(usage, "thoughtsTokenCount"), tokenCount(usage, "totalTokenCount"),
                root.path("candidates").path(0).path("finishReason").asText("UNKNOWN"));
    }

    private String extractResponseText(ResponseEntity<String> response) throws Exception {
        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
            throw new IllegalStateException("Gemini API가 정상 응답을 반환하지 않았습니다.");
        }

        JsonNode candidates = objectMapper.readTree(response.getBody()).path("candidates");
        if (!candidates.isArray() || candidates.isEmpty()) {
            throw new IllegalStateException("Gemini API 응답에 candidate가 없습니다.");
        }

        JsonNode textNode = candidates.get(0)
                .path("content")
                .path("parts")
                .get(0)
                .path("text");
        if (textNode.isMissingNode() || textNode.asText().isBlank()) {
            throw new IllegalStateException("Gemini API 응답 본문이 비어 있습니다.");
        }
        return cleanJsonText(textNode.asText());
    }

    private String buildYoutubeUrl(String youtubeId) {
        if (youtubeId == null || !YOUTUBE_ID_PATTERN.matcher(youtubeId).matches()) {
            return null;
        }
        return String.format(YOUTUBE_WATCH_URL_TEMPLATE, youtubeId);
    }

    private String cleanJsonText(String raw) {
        if (raw == null) return "{}";
        String trimmed = raw.trim();
        if (trimmed.startsWith("```json")) {
            trimmed = trimmed.substring(7);
        } else if (trimmed.startsWith("```")) {
            trimmed = trimmed.substring(3);
        }
        if (trimmed.endsWith("```")) {
            trimmed = trimmed.substring(0, trimmed.length() - 3);
        }
        return trimmed.trim();
    }

    /**
     * AI 호출 실패 또는 키 미설정 시, 영상 제목의 핵심 키워드를 정밀 분석하여
     * 요리에 딱 맞는 실제 재료와 조리 순서를 동적으로 생성하는 스마트 엔진
     */
    public String generateSmartFallbackJson(String title) {
        String safeTitle = (title != null && !title.isBlank()) ? title : "초간단 자취요리";
        // 유튜브에서 크롤링된 한글 유니코드 자모 분리(NFD: 라면) 현상을 표준 완성형(NFC: 라면)으로 정규화
        String normalizedTitle = java.text.Normalizer.normalize(safeTitle, java.text.Normalizer.Form.NFC);
        String lower = normalizedTitle.toLowerCase();

        String description;
        int cookTime = 5;
        int cost = 3500;
        String ingredientsJson;
        String stepsJson;

        if (lower.contains("라면") || lower.contains("열라면") || lower.contains("순두부")) {
            description = "얼큰하고 칼칼하게 끓여내는 1인분 분식/야식 라면 레시피";
            cookTime = 5;
            cost = 2500;
            ingredientsJson = """
            [
              { "name": "라면", "amount": "1", "unit": "봉지", "is_essential": true, "estimated_price": 1000 },
              { "name": "물", "amount": "550", "unit": "ml", "is_essential": true, "estimated_price": 0 },
              { "name": "계란", "amount": "1", "unit": "개", "is_essential": true, "estimated_price": 300 },
              { "name": "대파", "amount": "1/2", "unit": "대", "is_essential": false, "estimated_price": 300 },
              { "name": "다진마늘", "amount": "1/2", "unit": "큰술", "is_essential": false, "estimated_price": 200 }
            ]
            """;
            stepsJson = """
            [
              { "order": 1, "description": "냄비에 물 550ml와 분말스프, 건더기스프를 넣고 센 불에 끓인다.", "timer_seconds": 180 },
              { "order": 2, "description": "물이 끓어오르면 면을 넣고 면발을 들었다 놨다 하며 익힌다.", "timer_seconds": 180 },
              { "order": 3, "description": "계란과 송송 썬 대파를 넣고 30초간 더 끓여 완성한다.", "timer_seconds": 30 }
            ]
            """;
        } else if (lower.contains("파스타") || lower.contains("스파게티") || lower.contains("알리오")) {
            description = "원팬으로 설거지 없이 완성하는 1인분 알리오올리오 파스타";
            cookTime = 10;
            cost = 4000;
            ingredientsJson = """
            [
              { "name": "파스타면", "amount": "1", "unit": "인분(100g)", "is_essential": true, "estimated_price": 1000 },
              { "name": "올리브오일", "amount": "4", "unit": "큰술", "is_essential": true, "estimated_price": 600 },
              { "name": "통마늘", "amount": "5", "unit": "알", "is_essential": true, "estimated_price": 400 },
              { "name": "페페론치노", "amount": "3", "unit": "개", "is_essential": false, "estimated_price": 300 },
              { "name": "소금", "amount": "1/2", "unit": "큰술", "is_essential": true, "estimated_price": 100 }
            ]
            """;
            stepsJson = """
            [
              { "order": 1, "description": "끓는 물에 소금을 넣고 파스타면을 8분간 삶아 건져둔다.", "timer_seconds": 480 },
              { "order": 2, "description": "팬에 올리브오일을 두르고 편 썬 마늘과 페페론치노를 약불에 노릇하게 볶는다.", "timer_seconds": 90 },
              { "order": 3, "description": "삶은 면과 면수 2국자를 팬에 붓고 소스가 유화될 때까지 센 불에 볶는다.", "timer_seconds": 90 }
            ]
            """;
        } else if (lower.contains("스팸") || lower.contains("김치볶음밥") || lower.contains("볶음밥")) {
            description = "고소한 파기름과 짭조름한 감칠맛의 황금비율 1인분 볶음밥";
            cookTime = 7;
            cost = 3800;
            ingredientsJson = """
            [
              { "name": "밥", "amount": "1", "unit": "공기", "is_essential": true, "estimated_price": 1100 },
              { "name": "스팸", "amount": "1/2", "unit": "캔", "is_essential": true, "estimated_price": 1500 },
              { "name": "신김치", "amount": "1/2", "unit": "공기", "is_essential": true, "estimated_price": 600 },
              { "name": "대파", "amount": "1/2", "unit": "대", "is_essential": true, "estimated_price": 300 },
              { "name": "진간장", "amount": "1", "unit": "큰술", "is_essential": false, "estimated_price": 100 },
              { "name": "참기름", "amount": "1", "unit": "큰술", "is_essential": false, "estimated_price": 200 }
            ]
            """;
            stepsJson = """
            [
              { "order": 1, "description": "스팸은 작게 깍둑썰기하고, 대파는 송송 썰어 준비한다.", "timer_seconds": 60 },
              { "order": 2, "description": "팬에 식용유를 두르고 대파와 스팸을 노릇하게 볶아 기름을 낸다.", "timer_seconds": 90 },
              { "order": 3, "description": "김치와 간장 1큰술을 눌어붙듯이 태우며 함께 볶는다.", "timer_seconds": 90 },
              { "order": 4, "description": "밥을 넣고 주걱으로 으깨며 골고루 볶은 후 참기름을 둘러 마무리한다.", "timer_seconds": 120 }
            ]
            """;
        } else if (lower.contains("찌개") || lower.contains("된장") || lower.contains("김치찌개")) {
            description = "뚝배기나 작은 냄비 하나로 구수하게 끓여내는 1인분 찌개 요리";
            cookTime = 12;
            cost = 4500;
            ingredientsJson = """
            [
              { "name": "두부", "amount": "1/2", "unit": "모", "is_essential": true, "estimated_price": 800 },
              { "name": "돼지고기", "amount": "100", "unit": "g", "is_essential": true, "estimated_price": 1800 },
              { "name": "양파", "amount": "1/2", "unit": "개", "is_essential": true, "estimated_price": 300 },
              { "name": "대파", "amount": "1/2", "unit": "대", "is_essential": true, "estimated_price": 300 },
              { "name": "고춧가루", "amount": "1", "unit": "큰술", "is_essential": false, "estimated_price": 200 },
              { "name": "다진마늘", "amount": "1", "unit": "큰술", "is_essential": false, "estimated_price": 200 }
            ]
            """;
            stepsJson = """
            [
              { "order": 1, "description": "냄비에 고기를 넣고 센 불에 겉면이 하얗게 익을 때까지 볶는다.", "timer_seconds": 90 },
              { "order": 2, "description": "물 400ml와 양념장을 풀고 채소를 넣어 끓인다.", "timer_seconds": 300 },
              { "order": 3, "description": "마지막에 두부와 대파를 넣고 3분간 더 보글보글 끓여 완성한다.", "timer_seconds": 180 }
            ]
            """;
        } else if (lower.contains("참치") || lower.contains("덮밥") || lower.contains("마요")) {
            description = "불 안 쓰고 3분 만에 비벼먹는 초간단 자취생 인기 덮밥";
            cookTime = 3;
            cost = 3200;
            ingredientsJson = """
            [
              { "name": "밥", "amount": "1", "unit": "공기", "is_essential": true, "estimated_price": 1100 },
              { "name": "참치캔", "amount": "1", "unit": "캔(100g)", "is_essential": true, "estimated_price": 1500 },
              { "name": "마요네즈", "amount": "2", "unit": "큰술", "is_essential": true, "estimated_price": 200 },
              { "name": "진간장", "amount": "1/2", "unit": "큰술", "is_essential": false, "estimated_price": 100 },
              { "name": "김가루", "amount": "약간", "unit": "줌", "is_essential": false, "estimated_price": 100 }
            ]
            """;
            stepsJson = """
            [
              { "order": 1, "description": "참치는 기름을 꽉 짜서 볼에 담고 마요네즈와 간장을 섞는다.", "timer_seconds": 30 },
              { "order": 2, "description": "따뜻한 밥 위에 스크램블 에그와 양념한 참치를 올린다.", "timer_seconds": 30 },
              { "order": 3, "description": "김가루와 깨를 솔솔 뿌려 골고루 비벼 먹는다.", "timer_seconds": 0 }
            ]
            """;
        } else if (lower.contains("제육") || lower.contains("삼겹살") || lower.contains("돼지") || lower.contains("고기")) {
            description = "매콤달콤한 양념으로 센 불에 볶아내는 1인분 제육/고기 요리";
            cookTime = 8;
            cost = 4800;
            ingredientsJson = """
            [
              { "name": "돼지고기(앞다리/삼겹)", "amount": "150", "unit": "g", "is_essential": true, "estimated_price": 2500 },
              { "name": "대파", "amount": "1/2", "unit": "대", "is_essential": true, "estimated_price": 300 },
              { "name": "양파", "amount": "1/2", "unit": "개", "is_essential": true, "estimated_price": 300 },
              { "name": "고추장", "amount": "1", "unit": "큰술", "is_essential": true, "estimated_price": 300 },
              { "name": "진간장", "amount": "1", "unit": "큰술", "is_essential": true, "estimated_price": 100 },
              { "name": "다진마늘", "amount": "1/2", "unit": "큰술", "is_essential": false, "estimated_price": 200 }
            ]
            """;
            stepsJson = """
            [
              { "order": 1, "description": "팬을 달군 뒤 고기를 넣고 센 불에 겉면을 노릇하게 굽는다.", "timer_seconds": 120 },
              { "order": 2, "description": "설탕 1스푼을 고기 기름에 눌어붙듯이 볶아 불향을 입힌다.", "timer_seconds": 45 },
              { "order": 3, "description": "고추장, 간장, 다진마늘과 썰어둔 채소를 넣고 강불에 빠르게 볶아 완성한다.", "timer_seconds": 120 }
            ]
            """;
        } else if (lower.contains("떡볶이")) {
            description = "매콤달콤한 소스에 쫄깃한 떡이 어우러진 1인분 분식 떡볶이";
            cookTime = 8;
            cost = 3000;
            ingredientsJson = """
            [
              { "name": "떡볶이떡", "amount": "1", "unit": "줌(150g)", "is_essential": true, "estimated_price": 1000 },
              { "name": "사각어묵", "amount": "1", "unit": "장", "is_essential": true, "estimated_price": 500 },
              { "name": "고추장", "amount": "1.5", "unit": "큰술", "is_essential": true, "estimated_price": 300 },
              { "name": "고춧가루", "amount": "1", "unit": "큰술", "is_essential": false, "estimated_price": 200 },
              { "name": "설탕", "amount": "1", "unit": "큰술", "is_essential": true, "estimated_price": 100 },
              { "name": "대파", "amount": "1/2", "unit": "대", "is_essential": false, "estimated_price": 300 }
            ]
            """;
            stepsJson = """
            [
              { "order": 1, "description": "팬에 물 250ml와 고추장, 설탕, 고춧가루를 풀고 끓인다.", "timer_seconds": 90 },
              { "order": 2, "description": "물이 끓으면 떡과 먹기 좋게 썬 어묵을 넣고 중불에 졸인다.", "timer_seconds": 240 },
              { "order": 3, "description": "소스가 걸쭉해지면 송송 썬 대파를 넣고 한소끔 더 끓여 완성한다.", "timer_seconds": 60 }
            ]
            """;
        } else if (lower.contains("토스트") || lower.contains("샌드위치") || lower.contains("빵")) {
            description = "바삭한 식빵에 고소한 계란과 치즈가 녹아든 1인분 간편 토스트";
            cookTime = 5;
            cost = 2500;
            ingredientsJson = """
            [
              { "name": "식빵", "amount": "2", "unit": "장", "is_essential": true, "estimated_price": 800 },
              { "name": "계란", "amount": "1", "unit": "개", "is_essential": true, "estimated_price": 300 },
              { "name": "슬라이스치즈", "amount": "1", "unit": "장", "is_essential": true, "estimated_price": 400 },
              { "name": "버터", "amount": "1", "unit": "조각", "is_essential": true, "estimated_price": 300 },
              { "name": "딸기잼/케첩", "amount": "1", "unit": "큰술", "is_essential": false, "estimated_price": 200 }
            ]
            """;
            stepsJson = """
            [
              { "order": 1, "description": "팬에 버터를 녹이고 식빵을 앞뒤로 노릇하게 구워 꺼낸다.", "timer_seconds": 90 },
              { "order": 2, "description": "같은 팬에 계란을 풀거나 부쳐 계란 프라이를 만든다.", "timer_seconds": 60 },
              { "order": 3, "description": "구운 빵 사이에 치즈와 계란을 얹고 소스를 발라 덮는다.", "timer_seconds": 0 }
            ]
            """;
        } else {
            description = "영상에 맞춰 간단하고 빠르게 완성하는 자취생 맞춤 요리";
            cookTime = 6;
            cost = 3800;
            ingredientsJson = """
            [
              { "name": "주재료", "amount": "1", "unit": "인분", "is_essential": true, "estimated_price": 2000 },
              { "name": "대파", "amount": "1/2", "unit": "대", "is_essential": true, "estimated_price": 400 },
              { "name": "다진마늘", "amount": "1/2", "unit": "큰술", "is_essential": false, "estimated_price": 200 },
              { "name": "진간장", "amount": "1", "unit": "큰술", "is_essential": true, "estimated_price": 100 },
              { "name": "식용유", "amount": "2", "unit": "큰술", "is_essential": true, "estimated_price": 200 }
            ]
            """;
            stepsJson = """
            [
              { "order": 1, "description": "재료를 깨끗이 씻어 먹기 좋은 한 입 크기로 손질한다.", "timer_seconds": 60 },
              { "order": 2, "description": "달궈진 팬에 식용유를 두르고 대파와 마늘을 볶아 향을 낸다.", "timer_seconds": 45 },
              { "order": 3, "description": "주재료와 간장 양념을 넣고 중강불에서 골고루 볶아 완성한다.", "timer_seconds": 120 }
            ]
            """;
        }

        return String.format("""
        {
          "title": "%s",
          "description": "%s",
          "serving_size": 1,
          "prep_time_minutes": 3,
          "cook_time_minutes": %d,
          "difficulty": "EASY",
          "estimated_cost": %d,
          "ingredients": %s,
          "steps": %s
        }
        """, safeTitle.replace("\"", "\\\""), description, cookTime, cost, ingredientsJson.trim(), stepsJson.trim());
    }
}
