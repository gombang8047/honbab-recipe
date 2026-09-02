package com.honbab.diary.infra.youtube;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class YoutubeApiClient {

    private final RestTemplate restTemplate;

    @Value("${youtube.api-key:MOCK_KEY}")
    private String apiKey;

    private static final String YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search";

    /**
     * 키워드로 유튜브 쇼츠 검색 (Mock 연동 겸용)
     */
    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> searchShorts(String keyword, int maxResults) {
        if ("MOCK_KEY".equals(apiKey) || apiKey.isBlank()) {
            log.info("[MOCK] YouTube API Key 미설정으로 스텁 데이터를 반환합니다. keyword={}", keyword);
            return getMockSearchResults(keyword);
        }

        try {
            URI uri = UriComponentsBuilder.fromHttpUrl(YOUTUBE_SEARCH_URL)
                    .queryParam("part", "snippet")
                    .queryParam("q", keyword + " #shorts")
                    .queryParam("type", "video")
                    .queryParam("videoDuration", "short")
                    .queryParam("maxResults", maxResults)
                    .queryParam("key", apiKey)
                    .build()
                    .toUri();

            Map<String, Object> response = restTemplate.getForObject(uri, Map.class);
            if (response != null && response.containsKey("items")) {
                return (List<Map<String, Object>>) response.get("items");
            }
        } catch (Exception e) {
            log.error("YouTube API 호출 실패: {}", e.getMessage());
        }

        return Collections.emptyList();
    }

    private List<Map<String, Object>> getMockSearchResults(String keyword) {
        return List.of(
                Map.of(
                        "id", Map.of("videoId", "mock_shorts_01"),
                        "snippet", Map.of(
                                "title", "[" + keyword + "] 5분컷 초간단 계란볶음밥 레시피 #shorts",
                                "channelTitle", "자취요리왕",
                                "thumbnails", Map.of("high", Map.of("url", "https://img.youtube.com/vi/mock_shorts_01/hqdefault.jpg"))
                        )
                ),
                Map.of(
                        "id", Map.of("videoId", "mock_shorts_02"),
                        "snippet", Map.of(
                                "title", "[" + keyword + "] 원팬으로 끝내는 원조 김치볶음밥 #shorts",
                                "channelTitle", "혼밥레시피",
                                "thumbnails", Map.of("high", Map.of("url", "https://img.youtube.com/vi/mock_shorts_02/hqdefault.jpg"))
                        )
                )
        );
    }
}
