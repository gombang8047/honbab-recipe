package com.honbab.diary.infra.gemini;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class GeminiApiClientTest {

    private static final String YOUTUBE_ID = "9hE5-98ZeCg";
    private static final String GEMINI_RESPONSE = """
            {
              "candidates": [
                {
                  "content": {
                    "parts": [
                      { "text": "{}" }
                    ]
                  }
                }
              ]
            }
            """;

    private RestTemplate restTemplate;
    private GeminiApiClient geminiApiClient;

    @BeforeEach
    void setUp() {
        restTemplate = mock(RestTemplate.class);
        geminiApiClient = new GeminiApiClient(restTemplate, new ObjectMapper());
        ReflectionTestUtils.setField(geminiApiClient, "apiKey", "test-api-key");
    }

    @Test
    @DisplayName("프롬프트 비교 호출은 영상 입력과 동일 모델을 사용하고 실제 토큰 사용량을 반환한다")
    void benchmarkReturnsUsageMetadata() throws Exception {
        String response = """
                {"candidates":[{"finishReason":"STOP","content":{"parts":[{"text":"{}"}]}}],
                 "usageMetadata":{"promptTokenCount":100,"candidatesTokenCount":50,"thoughtsTokenCount":10,"totalTokenCount":160}}
                """;
        when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(String.class)))
                .thenReturn(ResponseEntity.ok(response));
        var result = geminiApiClient.generateVideoForPromptBenchmark("테스트", YOUTUBE_ID, "영상");
        assertThat(result.model()).isEqualTo("gemini-3.5-flash-lite");
        assertThat(result.inputTokens()).isEqualTo(100);
        assertThat(result.outputTokens()).isEqualTo(50);
        assertThat(result.thoughtTokens()).isEqualTo(10);
        assertThat(result.totalTokens()).isEqualTo(160);
        assertThat(result.finishReason()).isEqualTo("STOP");
    }

    @Test
    @DisplayName("프롬프트 비교의 호출 실패는 다른 모델·텍스트 폴백으로 숨기지 않는다")
    void benchmarkDoesNotFallback() {
        when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(String.class)))
                .thenThrow(new RuntimeException("테스트 API 오류"));
        org.assertj.core.api.Assertions.assertThatThrownBy(() ->
                geminiApiClient.generateVideoForPromptBenchmark("테스트", YOUTUBE_ID, "영상"))
                .hasMessage("테스트 API 오류");
        verify(restTemplate, times(1)).postForEntity(anyString(), any(HttpEntity.class), eq(String.class));
    }

    @Test
    @DisplayName("공개 YouTube URL과 텍스트 프롬프트를 멀티모달 요청으로 전달한다")
    @SuppressWarnings("unchecked")
    void sendsYoutubeVideoAndTextPrompt() {
        List<Map<String, Object>> requestBodies = new ArrayList<>();
        when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(String.class)))
                .thenAnswer(invocation -> {
                    HttpEntity<Map<String, Object>> entity = invocation.getArgument(1);
                    requestBodies.add(entity.getBody());
                    return ResponseEntity.ok(GEMINI_RESPONSE);
                });

        String result = geminiApiClient.generateRecipeJson("레시피를 분석하세요", YOUTUBE_ID, "테스트 영상");

        assertThat(result).isEqualTo("{}");
        assertThat(requestBodies).hasSize(1);

        List<Map<String, Object>> contents = (List<Map<String, Object>>) requestBodies.get(0).get("contents");
        List<Map<String, Object>> parts = (List<Map<String, Object>>) contents.get(0).get("parts");
        Map<String, Object> fileData = (Map<String, Object>) parts.get(0).get("file_data");

        assertThat(fileData.get("file_uri"))
                .isEqualTo("https://www.youtube.com/watch?v=" + YOUTUBE_ID);
        assertThat(parts.get(1).get("text")).isEqualTo("레시피를 분석하세요");
    }

    @Test
    @DisplayName("모든 영상 분석 모델이 실패하면 텍스트 기반 요청으로 전환한다")
    @SuppressWarnings("unchecked")
    void fallsBackToTextWhenVideoAnalysisFails() {
        List<Map<String, Object>> requestBodies = new ArrayList<>();
        when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(String.class)))
                .thenAnswer(invocation -> {
                    HttpEntity<Map<String, Object>> entity = invocation.getArgument(1);
                    requestBodies.add(entity.getBody());
                    if (requestBodies.size() <= 3) {
                        throw new RuntimeException("video analysis unavailable");
                    }
                    return ResponseEntity.ok(GEMINI_RESPONSE);
                });

        String result = geminiApiClient.generateRecipeJson("레시피를 분석하세요", YOUTUBE_ID, "테스트 영상");

        assertThat(result).isEqualTo("{}");
        assertThat(requestBodies).hasSize(4);

        for (int i = 0; i < 3; i++) {
            List<Map<String, Object>> contents =
                    (List<Map<String, Object>>) requestBodies.get(i).get("contents");
            List<Map<String, Object>> parts =
                    (List<Map<String, Object>>) contents.get(0).get("parts");
            assertThat(parts).hasSize(2);
            assertThat(parts.get(0)).containsKey("file_data");
        }

        List<Map<String, Object>> fallbackContents =
                (List<Map<String, Object>>) requestBodies.get(3).get("contents");
        List<Map<String, Object>> fallbackParts =
                (List<Map<String, Object>>) fallbackContents.get(0).get("parts");
        assertThat(fallbackParts).containsExactly(Map.of("text", "레시피를 분석하세요"));

        verify(restTemplate, times(4))
                .postForEntity(anyString(), any(HttpEntity.class), eq(String.class));
    }
}
