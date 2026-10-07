package com.honbab.diary.infra.gemini;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import java.util.List;
import static org.assertj.core.api.Assertions.*;

class GeminiPromptBuilderTest {
    @Test
    @DisplayName("간소화 후에도 원본 메타데이터·가격 총액·타이머·근거 필드 계약을 유지한다")
    void compactPromptPreservesInputsAndResponseContract() throws Exception {
        String description = "물 50ml, 계란 2개. 전자레인지 90초.";
        String comments = "간장은 1/2스푼입니다.";
        String prompt = new CompactRecipePromptBuilder().buildRecipePrompt("계란밥", description, comments, List.of("자취", "요리"));
        assertThat(prompt).contains(description, comments, "자취, 요리", "화면 자막과 음성", "원본 그대로", "생략하지 마세요");
        ObjectNode example = (ObjectNode) new ObjectMapper().readTree(prompt.substring(prompt.indexOf("{\"title\"")));
        GeminiPromptOptimizationBenchmarkTest.validateContract(example, "STOP", true);
        assertThat(example.path("estimated_cost").asInt()).isPositive();
        assertThat(example.path("ingredients").get(0).has("estimated_price")).isFalse();
        String legacy = new LegacyRecipePromptBuilder().buildRecipePrompt("계란밥", description, comments, List.of("자취", "요리"));
        assertThat(prompt.length()).isLessThan(legacy.length());
    }

    @Test
    @DisplayName("잘린 응답과 근거 필드 누락을 품질 비교 성공으로 인정하지 않는다")
    void benchmarkRejectsIncompleteRecipe() throws Exception {
        String prompt = new CompactRecipePromptBuilder().buildRecipePrompt("계란밥", null, null, List.of());
        ObjectNode example = (ObjectNode) new ObjectMapper().readTree(prompt.substring(prompt.indexOf("{\"title\"")));
        assertThatThrownBy(() -> GeminiPromptOptimizationBenchmarkTest.validateContract(example, "MAX_TOKENS", true))
                .isInstanceOf(IllegalArgumentException.class);
        var wrapped = new ObjectMapper().createArrayNode().add(example.deepCopy());
        assertThatThrownBy(() -> GeminiPromptOptimizationBenchmarkTest.validateContract(wrapped, "STOP", true))
                .hasMessageContaining("최상위 JSON");
        ((ObjectNode) example.path("ingredients").get(0)).remove("evidence_source");
        assertThatThrownBy(() -> GeminiPromptOptimizationBenchmarkTest.validateContract(example, "STOP", true))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("품질 비교를 통과하지 않은 간소화 프롬프트를 운영 기본값으로 사용하지 않는다")
    void productionKeepsVerifiedBaseline() {
        var tags = List.of("요리");
        assertThat(new GeminiPromptBuilder().buildRecipePrompt("계란밥", "계란 2개", null, tags))
                .isEqualTo(new LegacyRecipePromptBuilder().buildRecipePrompt("계란밥", "계란 2개", null, tags));
    }
}
