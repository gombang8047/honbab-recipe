package com.honbab.diary.infra.gemini;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;

@EnabledIfEnvironmentVariable(named = "RUN_GEMINI_EVALUATION", matches = "true")
class GeminiRecipeQualityEvaluationTest {

    private static final Pattern NUMBER_PATTERN = Pattern.compile("(\\d+(?:\\.\\d+)?)");
    private static final Set<String> GROUNDED_SOURCES = Set.of(
            "VIDEO_AUDIO", "VIDEO_TEXT", "VIDEO_VISUAL", "DESCRIPTION", "COMMENT"
    );

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    @DisplayName("동일 공개 쇼츠 집합에서 텍스트와 영상 레시피 생성 품질 및 시간을 비교한다")
    void compareTextAndVideoOnPublicShorts() throws Exception {
        String apiKey = System.getenv("GEMINI_API_KEY");
        assertThat(apiKey).as("GEMINI_API_KEY가 필요합니다.").isNotBlank();

        GeminiApiClient client = new GeminiApiClient(new RestTemplate(), objectMapper);
        ReflectionTestUtils.setField(client, "apiKey", apiKey);
        GeminiPromptBuilder promptBuilder = new GeminiPromptBuilder();
        List<EvaluationCase> cases = loadCases();

        Path reportDirectory = Path.of("build", "reports", "gemini-evaluation");
        Files.createDirectories(reportDirectory);

        Map<String, Aggregate> aggregates = new LinkedHashMap<>();
        aggregates.put("TEXT", new Aggregate("TEXT"));
        aggregates.put("VIDEO", new Aggregate("VIDEO"));
        List<CaseResult> results = new ArrayList<>();

        for (int index = 0; index < cases.size(); index++) {
            EvaluationCase evaluationCase = cases.get(index);
            List<String> modes = index % 2 == 0 ? List.of("TEXT", "VIDEO") : List.of("VIDEO", "TEXT");
            String prompt = promptBuilder.buildRecipePrompt(
                    evaluationCase.title(), evaluationCase.description(), null, List.of()
            );

            for (String mode : modes) {
                boolean includeVideo = mode.equals("VIDEO");
                long startedAt = System.nanoTime();
                try {
                    String json = client.generateRecipeJsonForEvaluation(
                            prompt, evaluationCase.youtubeId(), evaluationCase.title(), includeVideo
                    );
                    long elapsedMs = (System.nanoTime() - startedAt) / 1_000_000;
                    Files.writeString(
                            reportDirectory.resolve(evaluationCase.youtubeId() + "-" + mode.toLowerCase(Locale.ROOT) + ".json"),
                            json,
                            StandardCharsets.UTF_8
                    );
                    Metrics metrics = evaluate(evaluationCase, objectMapper.readTree(json), includeVideo);
                    aggregates.get(mode).addSuccess(elapsedMs, metrics);
                    results.add(new CaseResult(evaluationCase.youtubeId(), mode, elapsedMs, metrics, null));
                } catch (Exception e) {
                    long elapsedMs = (System.nanoTime() - startedAt) / 1_000_000;
                    aggregates.get(mode).addFailure(elapsedMs);
                    results.add(new CaseResult(evaluationCase.youtubeId(), mode, elapsedMs, null, e.getMessage()));
                }
            }
        }

        String report = buildReport(cases.size(), aggregates, results);
        Files.writeString(reportDirectory.resolve("summary.md"), report, StandardCharsets.UTF_8);
        System.out.println(report);

        assertThat(aggregates.get("TEXT").successCount).isGreaterThan(0);
        assertThat(aggregates.get("VIDEO").successCount).isGreaterThan(0);
    }

    List<EvaluationCase> loadCases() throws Exception {
        try (InputStream input = getClass().getResourceAsStream("/gemini-evaluation-dataset.json")) {
            assertThat(input).isNotNull();
            return objectMapper.readValue(input, new TypeReference<>() {});
        }
    }

    Metrics evaluate(EvaluationCase expected, JsonNode actual, boolean videoMode) {
        List<JsonNode> predictedIngredients = elements(actual.path("ingredients"));
        List<JsonNode> predictedSteps = elements(actual.path("steps"));

        int matchedIngredients = 0;
        int numericExpected = 0;
        int numericCorrect = 0;
        for (ExpectedIngredient ingredient : expected.ingredients()) {
            JsonNode matched = findIngredient(predictedIngredients, ingredient);
            if (matched != null) {
                matchedIngredients++;
            }
            if (ingredient.amount() != null) {
                numericExpected++;
                if (matched != null && amountMatches(ingredient, matched)) {
                    numericCorrect++;
                }
            }
        }

        int matchedSteps = 0;
        int timerCount = 0;
        double timerAbsoluteError = 0;
        for (ExpectedStep step : expected.steps()) {
            if (stepPresent(predictedSteps, step)) {
                matchedSteps++;
            }
            if (step.timerSeconds() != null) {
                timerCount++;
                int predictedTimer = predictedSteps.stream()
                        .filter(candidate -> stepMatches(candidate, step))
                        .mapToInt(candidate -> candidate.path("timer_seconds").asInt(0))
                        .sum();
                timerAbsoluteError += Math.abs(predictedTimer - step.timerSeconds());
            }
        }

        List<JsonNode> evidenceItems = new ArrayList<>(predictedIngredients);
        evidenceItems.addAll(predictedSteps);
        int grounded = 0;
        int videoEvidenceItems = 0;
        int timestampVerified = 0;
        for (JsonNode item : evidenceItems) {
            String source = item.path("evidence_source").asText("");
            if (GROUNDED_SOURCES.contains(source)) {
                grounded++;
            }
            if (videoMode && source.startsWith("VIDEO_")) {
                videoEvidenceItems++;
                if (item.hasNonNull("evidence_timestamp_seconds")) {
                    int timestamp = item.path("evidence_timestamp_seconds").asInt(-1);
                    if (timestamp >= 0 && timestamp <= expected.durationSeconds()) {
                        timestampVerified++;
                    }
                }
            }
        }

        return new Metrics(
                matchedIngredients,
                predictedIngredients.size(),
                expected.ingredients().size(),
                numericCorrect,
                numericExpected,
                matchedSteps,
                expected.steps().size(),
                timerAbsoluteError,
                timerCount,
                grounded,
                evidenceItems.size(),
                videoEvidenceItems,
                timestampVerified
        );
    }

    private JsonNode findIngredient(List<JsonNode> predicted, ExpectedIngredient expected) {
        for (JsonNode candidate : predicted) {
            String actualName = normalize(candidate.path("name").asText());
            boolean matched = expected.aliases().stream()
                    .map(this::normalize)
                    .anyMatch(alias -> actualName.contains(alias) || alias.contains(actualName));
            if (matched) {
                return candidate;
            }
        }
        return null;
    }

    private boolean stepMatches(JsonNode candidate, ExpectedStep expected) {
        String description = normalize(candidate.path("description").asText());
        return expected.keywords().stream()
                .map(this::normalize)
                .allMatch(description::contains);
    }

    private boolean stepPresent(List<JsonNode> predicted, ExpectedStep expected) {
        String combinedDescriptions = predicted.stream()
                .map(step -> normalize(step.path("description").asText()))
                .reduce("", (left, right) -> left + right);
        return expected.keywords().stream()
                .map(this::normalize)
                .allMatch(combinedDescriptions::contains);
    }

    private boolean amountMatches(ExpectedIngredient expected, JsonNode actual) {
        Double expectedNumber = parseNumber(expected.amount());
        Double actualNumber = parseNumber(actual.path("amount").asText());
        if (expectedNumber == null || actualNumber == null) {
            return false;
        }
        boolean numberMatches = Math.abs(expectedNumber - actualNumber) <= Math.max(0.02, expectedNumber * 0.02);
        return numberMatches && normalizeUnit(expected.unit()).equals(normalizeUnit(actual.path("unit").asText()));
    }

    private Double parseNumber(String value) {
        if (value == null) return null;
        String normalized = value.trim();
        if (normalized.matches("\\d+/\\d+")) {
            String[] fraction = normalized.split("/");
            return Double.parseDouble(fraction[0]) / Double.parseDouble(fraction[1]);
        }
        Matcher matcher = NUMBER_PATTERN.matcher(normalized);
        return matcher.find() ? Double.parseDouble(matcher.group(1)) : null;
    }

    private String normalizeUnit(String unit) {
        if (unit == null) return "";
        String normalized = normalize(unit);
        if (Set.of("스푼", "큰술", "밥숟가락", "tbsp", "t").contains(normalized)) return "tbsp";
        if (Set.of("작은술", "티스푼", "tsp").contains(normalized)) return "tsp";
        return normalized;
    }

    private String normalize(String value) {
        if (value == null) return "";
        return value.toLowerCase(Locale.ROOT).replaceAll("[^0-9a-z가-힣]", "");
    }

    private List<JsonNode> elements(JsonNode array) {
        List<JsonNode> values = new ArrayList<>();
        if (array.isArray()) array.forEach(values::add);
        return values;
    }

    private String buildReport(int caseCount, Map<String, Aggregate> aggregates, List<CaseResult> results) {
        StringBuilder report = new StringBuilder();
        report.append("# Gemini 텍스트/영상 레시피 실제 평가 결과\n\n");
        report.append("- 공개 쇼츠 고정 평가 집합: ").append(caseCount).append("개\n");
        report.append("- 정답 기준: 영상 제작자가 공개 설명란에 작성한 재료·수치·조리 단계\n");
        report.append("- 비교 조건: 동일 프롬프트, 동일 모델 폴백 순서, 입력 모드만 TEXT/VIDEO로 분리\n");
        report.append("- 분량이 명시되지 않은 다인분 제육볶음은 1인분 환산 정답을 확정할 수 없어 수치 정확도 계산에서 제외\n\n");
        report.append("| 모드 | 성공률 | 평균 | p50 | p95 | 재료 Precision | 재료 Recall | 수치 정확도 | 단계 누락률 | 타이머 MAE | 선언 근거 비율 | 영상 타임스탬프 유효율 |\n");
        report.append("| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |\n");
        for (Aggregate aggregate : aggregates.values()) {
            report.append(aggregate.summaryRow(caseCount));
        }
        report.append("\n## 영상별 결과\n\n");
        report.append("| YouTube ID | 모드 | 시간 | 결과 |\n| --- | --- | ---: | --- |\n");
        for (CaseResult result : results) {
            report.append("| ").append(result.youtubeId()).append(" | ").append(result.mode())
                    .append(" | ").append(result.elapsedMs()).append("ms | ")
                    .append(result.error() == null ? "성공" : "실패: " + sanitize(result.error()))
                    .append(" |\n");
        }
        report.append("\n> 이 평가는 제작자 설명란을 정답으로 사용한다. evidence_source와 타임스탬프는 모델이 선언한 값의 형식만 검증했으며 실제 프레임과의 일치는 별도 사람 검수가 필요하다. p95는 5개 표본의 탐색적 수치이며 운영 성능을 대표하지 않는다.\n");
        return report.toString();
    }

    private String sanitize(String value) {
        return value == null ? "" : value.replace("|", "/").replaceAll("[\\r\\n]+", " ");
    }

    record EvaluationCase(String youtubeId, String title, int durationSeconds, String description,
                          List<ExpectedIngredient> ingredients, List<ExpectedStep> steps) {}
    record ExpectedIngredient(String name, List<String> aliases, String amount, String unit) {}
    record ExpectedStep(List<String> keywords, Integer timerSeconds) {}
    record CaseResult(String youtubeId, String mode, long elapsedMs, Metrics metrics, String error) {}

    record Metrics(int ingredientMatches, int predictedIngredients, int expectedIngredients,
                   int numericCorrect, int numericExpected, int stepMatches, int expectedSteps,
                   double timerAbsoluteError, int timerCount, int groundedItems, int evidenceItems,
                   int videoEvidenceItems, int validVideoTimestamps) {}

    static class Aggregate {
        private final String mode;
        private int successCount;
        private int failureCount;
        private final List<Long> latencies = new ArrayList<>();
        private int ingredientMatches;
        private int predictedIngredients;
        private int expectedIngredients;
        private int numericCorrect;
        private int numericExpected;
        private int stepMatches;
        private int expectedSteps;
        private double timerAbsoluteError;
        private int timerCount;
        private int groundedItems;
        private int evidenceItems;
        private int videoEvidenceItems;
        private int validVideoTimestamps;

        Aggregate(String mode) { this.mode = mode; }

        void addSuccess(long elapsedMs, Metrics metrics) {
            successCount++;
            latencies.add(elapsedMs);
            ingredientMatches += metrics.ingredientMatches();
            predictedIngredients += metrics.predictedIngredients();
            expectedIngredients += metrics.expectedIngredients();
            numericCorrect += metrics.numericCorrect();
            numericExpected += metrics.numericExpected();
            stepMatches += metrics.stepMatches();
            expectedSteps += metrics.expectedSteps();
            timerAbsoluteError += metrics.timerAbsoluteError();
            timerCount += metrics.timerCount();
            groundedItems += metrics.groundedItems();
            evidenceItems += metrics.evidenceItems();
            videoEvidenceItems += metrics.videoEvidenceItems();
            validVideoTimestamps += metrics.validVideoTimestamps();
        }

        void addFailure(long elapsedMs) {
            failureCount++;
            latencies.add(elapsedMs);
        }

        String summaryRow(int totalCases) {
            return String.format(Locale.ROOT,
                    "| %s | %.1f%% (%d/%d) | %.0fms | %dms | %dms | %.1f%% | %.1f%% | %.1f%% | %.1f%% | %.1fs | %.1f%% | %.1f%% |%n",
                    mode,
                    ratio(successCount, totalCases), successCount, totalCases,
                    latencies.stream().mapToLong(Long::longValue).average().orElse(0),
                    percentile(latencies, 0.50), percentile(latencies, 0.95),
                    ratio(ingredientMatches, predictedIngredients),
                    ratio(ingredientMatches, expectedIngredients),
                    ratio(numericCorrect, numericExpected),
                    100.0 - ratio(stepMatches, expectedSteps),
                    timerCount == 0 ? 0 : timerAbsoluteError / timerCount,
                    ratio(groundedItems, evidenceItems),
                    ratio(validVideoTimestamps, videoEvidenceItems)
            );
        }

        private static double ratio(int numerator, int denominator) {
            return denominator == 0 ? 0 : numerator * 100.0 / denominator;
        }

        private static long percentile(List<Long> values, double percentile) {
            if (values.isEmpty()) return 0;
            List<Long> sorted = values.stream().sorted(Comparator.naturalOrder()).toList();
            int index = Math.max(0, (int) Math.ceil(percentile * sorted.size()) - 1);
            return sorted.get(index);
        }
    }
}
