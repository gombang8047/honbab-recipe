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
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class GeminiApiClient {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${gemini.api-key:AQ.Ab8RN6KWyU73mCyuABcXGRvFW8mgDv3ZnmHGNIUU4tTMaHXNQQ}")
    private String apiKey;

    private static final String GEMINI_URL_TEMPLATE =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=%s";

    /**
     * Gemini 1.5 Flash로 프롬프트 전송 후 구조화된 JSON 레시피 문자열 수신
     */
    public String generateRecipeJson(String prompt, String fallbackTitle) {
        if (apiKey == null || apiKey.isBlank() || "MOCK_KEY".equalsIgnoreCase(apiKey)) {
            log.info("[MOCK] Gemini API Key 미설정으로 스마트 템플릿 레시피를 생성합니다. title={}", fallbackTitle);
            return generateSmartFallbackJson(fallbackTitle);
        }

        try {
            String url = String.format(GEMINI_URL_TEMPLATE, apiKey);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> requestBody = Map.of(
                    "contents", List.of(
                            Map.of("parts", List.of(
                                    Map.of("text", prompt)
                            ))
                    ),
                    "generationConfig", Map.of(
                            "responseMimeType", "application/json",
                            "temperature", 0.3
                    )
            );

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            log.info("Gemini 1.5 Flash API 호출 시작...");
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode rootNode = objectMapper.readTree(response.getBody());
                JsonNode candidates = rootNode.path("candidates");
                if (candidates.isArray() && !candidates.isEmpty()) {
                    JsonNode textNode = candidates.get(0)
                            .path("content")
                            .path("parts")
                            .get(0)
                            .path("text");
                    if (!textNode.isMissingNode()) {
                        log.info("Gemini 1.5 Flash 레시피 추출 성공!");
                        return textNode.asText();
                    }
                }
            }
        } catch (Exception e) {
            log.error("Gemini API 호출 중 오류 발생: {}. 스마트 템플릿으로 대체합니다.", e.getMessage());
        }

        return generateSmartFallbackJson(fallbackTitle);
    }

    private String generateSmartFallbackJson(String title) {
        String safeTitle = (title != null && !title.isBlank()) ? title : "초간단 자취요리";
        return """
        {
          "title": "%s",
          "description": "5분 안에 만드는 자취생 필수 1인분 초간단 레시피",
          "serving_size": 1,
          "prep_time_minutes": 3,
          "cook_time_minutes": 5,
          "difficulty": "EASY",
          "estimated_cost": 3500,
          "ingredients": [
            { "name": "주재료", "amount": "1", "unit": "인분", "is_essential": true, "estimated_price": 2000 },
            { "name": "계란", "amount": "2", "unit": "개", "is_essential": true, "estimated_price": 600 },
            { "name": "대파", "amount": "1/2", "unit": "대", "is_essential": false, "estimated_price": 400 },
            { "name": "진간장", "amount": "1", "unit": "큰술", "is_essential": true, "estimated_price": 200 },
            { "name": "참기름", "amount": "1/2", "unit": "큰술", "is_essential": false, "estimated_price": 300 }
          ],
          "steps": [
            { "order": 1, "description": "팬에 식용유를 두르고 대파를 볶아 파기름을 냅니다.", "timer_seconds": 30, "tip": "약불에서 은은하게 볶아야 파가 타지 않고 향이 잘 우러납니다." },
            { "order": 2, "description": "주재료와 간장 1큰술을 넣고 강불에서 골고루 볶아줍니다.", "timer_seconds": 60, "tip": "팬 가장자리에 간장을 둘러 불향을 입혀주면 더욱 맛있습니다." },
            { "order": 3, "description": "계란을 풀어 스크램블을 만든 뒤 재료와 섞고 참기름을 둘러 마무리합니다.", "timer_seconds": 45, "tip": "불을 끄고 남은 잔열로 참기름을 섞어야 고소한 향이 보존됩니다." }
          ]
        }
        """.formatted(safeTitle.replace("\"", "\\\""));
    }
}
