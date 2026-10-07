package com.honbab.diary.infra.gemini;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.function.ToDoubleFunction;

import static org.assertj.core.api.Assertions.assertThat;

/** Real paid API calls, explicitly opted in. Both variants use video and a fixed model. */
@EnabledIfEnvironmentVariable(named = "RUN_GEMINI_PROMPT_BENCHMARK", matches = "true")
class GeminiPromptOptimizationBenchmarkTest {
    private final ObjectMapper mapper = new ObjectMapper();
    private final GeminiRecipeQualityEvaluationTest evaluator = new GeminiRecipeQualityEvaluationTest();

    record Observation(int round, String youtubeId, String variant, long elapsedMs, int promptChars,
                       int responseBytes, GeminiApiClient.GenerationMeasurement generation,
                       GeminiRecipeQualityEvaluationTest.Metrics quality, String error) {}

    @Test
    @DisplayName("동일 영상·모델에서 기존 및 간소화 프롬프트의 시간·토큰·품질을 비교한다")
    void compareOriginalAndCompactPrompts() throws Exception {
        String key = System.getenv("GEMINI_API_KEY");
        assertThat(key).as("GEMINI_API_KEY가 필요합니다.").isNotBlank();
        int rounds = Integer.parseInt(System.getenv().getOrDefault("GEMINI_BENCHMARK_ROUNDS", "3"));
        assertThat(rounds).isBetween(1, 10);
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5_000);
        factory.setReadTimeout(60_000);
        GeminiApiClient client = new GeminiApiClient(new RestTemplate(factory), mapper);
        ReflectionTestUtils.setField(client, "apiKey", key);
        var cases = evaluator.loadCases();
        Path directory = Path.of("build", "reports", "gemini-prompt-benchmark",
                LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss-SSS")));
        Files.createDirectories(directory);
        List<Observation> results = new ArrayList<>();
        LegacyRecipePromptBuilder before = new LegacyRecipePromptBuilder();
        CompactRecipePromptBuilder after = new CompactRecipePromptBuilder();

        for (int round = 1; round <= rounds; round++) {
            for (int index = 0; index < cases.size(); index++) {
                var video = cases.get(index);
                Map<String, String> prompts = Map.of(
                        "BEFORE", before.buildRecipePrompt(video.title(), video.description(), null, List.of()),
                        "AFTER", after.buildRecipePrompt(video.title(), video.description(), null, List.of()));
                List<String> order = (round + index) % 2 == 0
                        ? List.of("BEFORE", "AFTER") : List.of("AFTER", "BEFORE");
                for (String variant : order) {
                    String prompt = prompts.get(variant);
                    String prefix = "r" + round + "-" + video.youtubeId() + "-" + variant;
                    Files.writeString(directory.resolve(prefix + "-prompt.txt"), prompt, StandardCharsets.UTF_8);
                    long started = System.nanoTime();
                    GeminiApiClient.GenerationMeasurement generation = null;
                    long elapsed = 0;
                    int bytes = 0;
                    try {
                        generation = client.generateVideoForPromptBenchmark(prompt, video.youtubeId(), video.title());
                        elapsed = (System.nanoTime() - started) / 1_000_000;
                        bytes = generation.json().getBytes(StandardCharsets.UTF_8).length;
                        Files.writeString(directory.resolve(prefix + ".json"), generation.json(), StandardCharsets.UTF_8);
                        JsonNode json = mapper.readTree(generation.json());
                        validateContract(json, generation.finishReason(), variant.equals("AFTER"));
                        results.add(new Observation(round, video.youtubeId(), variant, elapsed, prompt.length(), bytes,
                                generation, evaluator.evaluate(video, json, true), null));
                    } catch (Exception e) {
                        if (generation == null) elapsed = (System.nanoTime() - started) / 1_000_000;
                        results.add(new Observation(round, video.youtubeId(), variant, elapsed, prompt.length(), bytes,
                                generation, null, failureReason(e, generation != null)));
                    }
                    System.out.printf(Locale.ROOT, "PROMPT_PROGRESS round=%d video=%s variant=%s elapsed=%dms success=%s%n",
                            round, video.youtubeId(), variant, elapsed, results.get(results.size() - 1).error() == null);
                }
            }
        }
        mapper.writerWithDefaultPrettyPrinter().writeValue(directory.resolve("measurements.json").toFile(), results);
        String report = report(results, cases.size() * rounds);
        Files.writeString(directory.resolve("summary.md"), report, StandardCharsets.UTF_8);
        System.out.println(report);
        System.out.println("PROMPT_BENCHMARK_REPORT=" + directory.toAbsolutePath());
        assertThat(results.stream().filter(row -> row.error() != null)
                .map(row -> "r" + row.round() + " " + row.youtubeId() + " " + row.variant() + ": " + row.error()).toList())
                .as("호출·JSON 계약 실패 목록. 전체 비교는 " + directory.resolve("summary.md"))
                .isEmpty();
    }

    private static String failureReason(Exception error, boolean receivedResponse) {
        // Never include transport exception messages, which can contain API-key URLs.
        String reason = error.getClass().getSimpleName();
        if (receivedResponse && (error instanceof IllegalArgumentException
                || error instanceof com.fasterxml.jackson.core.JsonProcessingException)) {
            String message = Objects.toString(error.getMessage(), "").replaceAll("[\\r\\n|]", " ");
            reason += ": " + message.substring(0, Math.min(180, message.length()));
        }
        return reason;
    }

    static void validateContract(JsonNode json, String finishReason, boolean compact) {
        require("STOP".equals(finishReason), "응답이 정상 종료되지 않았습니다.");
        require(json.isObject(), "최상위 JSON은 레시피 객체여야 합니다. 배열은 허용하지 않습니다.");
        for (String key : List.of("title", "description")) requireText(json, key);
        for (String key : List.of("serving_size", "prep_time_minutes", "cook_time_minutes", "estimated_cost"))
            require(json.path(key).isIntegralNumber() && json.path(key).asInt() >= 0, "잘못된 수치: " + key);
        require(json.path("serving_size").asInt() > 0, "인분은 양수여야 합니다.");
        require(Set.of("EASY", "MEDIUM", "HARD").contains(json.path("difficulty").asText()), "난이도 오류");
        JsonNode ingredients = json.path("ingredients"), steps = json.path("steps");
        require(ingredients.isArray() && !ingredients.isEmpty(), "재료 배열 누락");
        require(steps.isArray() && !steps.isEmpty(), "단계 배열 누락");
        for (JsonNode ingredient : ingredients) {
            for (String key : List.of("name", "amount")) requireText(ingredient, key);
            // Amounts such as "약간" may legitimately have no separate unit.
            require(ingredient.path("unit").isTextual(), "단위 문자열 누락");
            require(ingredient.path("is_essential").isBoolean(), "필수 재료 여부 누락");
            require(!compact || !ingredient.has("estimated_price"), "간소화 응답에 미사용 가격 필드 존재");
            validateEvidence(ingredient);
        }
        int order = 1;
        for (JsonNode step : steps) {
            requireText(step, "description");
            require(step.path("order").isIntegralNumber() && step.path("order").asInt() == order++, "단계 순번 오류");
            require(step.path("timer_seconds").isIntegralNumber() && step.path("timer_seconds").asInt() >= 0, "타이머 오류");
            validateEvidence(step);
        }
    }

    private static void validateEvidence(JsonNode item) {
        require(Set.of("VIDEO_AUDIO", "VIDEO_TEXT", "VIDEO_VISUAL", "DESCRIPTION", "COMMENT", "ESTIMATED")
                .contains(item.path("evidence_source").asText()), "근거 유형 누락");
        require(item.has("evidence_timestamp_seconds"), "근거 시각 필드 누락");
        JsonNode time = item.path("evidence_timestamp_seconds");
        require(time.isNull() || (time.isNumber() && time.asDouble() >= 0), "근거 시각 오류");
    }

    private static void requireText(JsonNode item, String key) {
        require(item.path(key).isTextual() && !item.path(key).asText().isBlank(), "문자열 필드 누락: " + key);
    }

    private static void require(boolean condition, String message) {
        if (!condition) throw new IllegalArgumentException(message);
    }

    private String report(List<Observation> rows, int expectedPerVariant) {
        List<Observation> before = rows.stream().filter(r -> r.variant().equals("BEFORE") && r.error() == null).toList();
        List<Observation> after = rows.stream().filter(r -> r.variant().equals("AFTER") && r.error() == null).toList();
        // Only complete pairs are compared, so a failed slow request cannot improve one side's average.
        Set<String> completePairs = new HashSet<>();
        for (Observation b : before) if (after.stream().anyMatch(a -> a.round() == b.round() && a.youtubeId().equals(b.youtubeId())))
            completePairs.add(b.round() + ":" + b.youtubeId());
        List<Observation> pairedBefore = before.stream().filter(r -> completePairs.contains(r.round() + ":" + r.youtubeId())).toList();
        List<Observation> pairedAfter = after.stream().filter(r -> completePairs.contains(r.round() + ":" + r.youtubeId())).toList();
        StringBuilder out = new StringBuilder("\n# 영상 레시피 프롬프트 간소화 비교 결과\n\n");
        out.append("동일 공개 영상·고정 모델 gemini-3.5-flash-lite·영상 입력·temperature 0.2, 교대 호출, 모델/텍스트 폴백 없음.\n\n");
        out.append(String.format(Locale.ROOT, "호출·JSON 계약 성공: 기존 %d/%d, 간소화 %d/%d. 비교 가능한 쌍: %d개.\n\n",
                before.size(), expectedPerVariant, after.size(), expectedPerVariant, completePairs.size()));
        out.append("| 항목 (완료 쌍 기준) | 기존 | 간소화 | 변화 |\n| --- | ---: | ---: | ---: |\n");
        appendMetric(out, "평균 Gemini 호출 시간(ms)", mean(pairedBefore, Observation::elapsedMs), mean(pairedAfter, Observation::elapsedMs));
        appendMetric(out, "p50(ms)", percentile(pairedBefore, .5), percentile(pairedAfter, .5));
        appendMetric(out, "p95(ms)", percentile(pairedBefore, .95), percentile(pairedAfter, .95));
        appendMetric(out, "평균 텍스트 프롬프트 문자 수", mean(pairedBefore, Observation::promptChars), mean(pairedAfter, Observation::promptChars));
        appendMetric(out, "평균 응답 크기(bytes)", mean(pairedBefore, Observation::responseBytes), mean(pairedAfter, Observation::responseBytes));
        appendMetric(out, "평균 입력 토큰(영상 포함)", tokens(pairedBefore, "input"), tokens(pairedAfter, "input"));
        appendMetric(out, "평균 출력 토큰", tokens(pairedBefore, "output"), tokens(pairedAfter, "output"));
        appendMetric(out, "평균 사고 토큰", tokens(pairedBefore, "thought"), tokens(pairedAfter, "thought"));
        appendMetric(out, "평균 전체 토큰", tokens(pairedBefore, "total"), tokens(pairedAfter, "total"));
        out.append("\n| 품질 (설명란 기준) | 기존 | 간소화 |\n| --- | ---: | ---: |\n");
        String[] labels = {"재료 Precision(%)", "재료 Recall(%)", "수치 정확도(%)", "단계 누락률(%)", "타이머 MAE(초)", "모델 선언 근거 비율(%)", "타임스탬프 범위 유효율(%)"};
        double[] bq = quality(pairedBefore), aq = quality(pairedAfter);
        for (int i = 0; i < labels.length; i++) out.append(String.format(Locale.ROOT, "| %s | %s | %s |%n", labels[i], number(bq[i]), number(aq[i])));
        boolean noRegression = !completePairs.isEmpty();
        for (int i = 0; i < bq.length; i++) noRegression &= Double.isFinite(bq[i]) && Double.isFinite(aq[i])
                && ((i == 3 || i == 4) ? aq[i] <= bq[i] : aq[i] >= bq[i]);
        boolean complete = before.size() == expectedPerVariant && after.size() == expectedPerVariant;
        boolean faster = mean(pairedAfter, Observation::elapsedMs) < mean(pairedBefore, Observation::elapsedMs)
                && percentile(pairedAfter, .95) <= percentile(pairedBefore, .95);
        out.append("\n채택 판단: ").append(complete && noRegression && faster
                ? "자동 평가 기준 시간·품질 조건 충족. 실제 영상 수동 검수 후 채택 판단."
                : "호출 실패 또는 시간·품질 조건 미충족. 원본 결과 검토 후 수정/재평가 필요.").append("\n");
        out.append("\n측정은 Gemini 요청부터 응답 추출까지이며 댓글 조회·DB·사용자 HTTP 전체 로딩시간은 제외합니다. 토큰 미제공은 N/A입니다. 15개/방식의 p95는 탐색적 수치입니다. 근거 유형·시각 범위는 실제 화면/음성 사실 검증이 아닙니다.\n");
        out.append("\n| 회차 | 영상 | 방식 | 시간(ms) | 상태 |\n| --- | --- | --- | ---: | --- |\n");
        for (Observation r : rows) out.append(String.format(Locale.ROOT, "| %d | %s | %s | %d | %s |%n", r.round(), r.youtubeId(), r.variant(), r.elapsedMs(), r.error() == null ? "성공" : r.error()));
        return out.toString();
    }

    private static double[] quality(List<Observation> rows) {
        double matched = 0, predicted = 0, expected = 0, correct = 0, numbers = 0, steps = 0, expectedSteps = 0;
        double timerError = 0, timers = 0, grounded = 0, evidence = 0, validTimes = 0, videoEvidence = 0;
        for (Observation row : rows) {
            var q = row.quality();
            matched += q.ingredientMatches(); predicted += q.predictedIngredients(); expected += q.expectedIngredients();
            correct += q.numericCorrect(); numbers += q.numericExpected(); steps += q.stepMatches(); expectedSteps += q.expectedSteps();
            timerError += q.timerAbsoluteError(); timers += q.timerCount(); grounded += q.groundedItems(); evidence += q.evidenceItems();
            validTimes += q.validVideoTimestamps(); videoEvidence += q.videoEvidenceItems();
        }
        return new double[]{ratio(matched, predicted), ratio(matched, expected), ratio(correct, numbers),
                100 - ratio(steps, expectedSteps), timers == 0 ? Double.NaN : timerError / timers,
                ratio(grounded, evidence), ratio(validTimes, videoEvidence)};
    }

    private static double ratio(double value, double total) { return total == 0 ? Double.NaN : value / total * 100; }
    private static double mean(List<Observation> rows, ToDoubleFunction<Observation> value) {
        return rows.stream().mapToDouble(value).average().orElse(Double.NaN);
    }
    private static double percentile(List<Observation> rows, double p) {
        long[] sorted = rows.stream().mapToLong(Observation::elapsedMs).sorted().toArray();
        return sorted.length == 0 ? Double.NaN : sorted[(int) Math.ceil(sorted.length * p) - 1];
    }
    private static double tokens(List<Observation> rows, String type) {
        List<Integer> counts = rows.stream().map(r -> switch (type) {
            case "input" -> r.generation().inputTokens();
            case "output" -> r.generation().outputTokens();
            case "thought" -> r.generation().thoughtTokens();
            default -> r.generation().totalTokens();
        }).filter(Objects::nonNull).toList();
        return counts.size() != rows.size() || counts.isEmpty() ? Double.NaN : counts.stream().mapToInt(Integer::intValue).average().orElseThrow();
    }
    private static String number(double value) { return Double.isFinite(value) ? String.format(Locale.ROOT, "%.2f", value) : "N/A"; }
    private static void appendMetric(StringBuilder out, String name, double before, double after) {
        out.append(String.format(Locale.ROOT, "| %s | %s | %s | %s |%n", name, number(before), number(after),
                Double.isFinite(before) && Double.isFinite(after) && before > 0 ? number((after - before) / before * 100) + "%" : "N/A"));
    }
}
