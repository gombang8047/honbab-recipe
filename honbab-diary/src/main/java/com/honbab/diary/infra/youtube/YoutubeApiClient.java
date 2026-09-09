package com.honbab.diary.infra.youtube;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class YoutubeApiClient {

    private final RestTemplate restTemplate;

    @Value("${youtube.api-key:MOCK_KEY}")
    private String apiKey;

    private static final String YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search";
    private static final String YOUTUBE_VIDEOS_URL = "https://www.googleapis.com/youtube/v3/videos";

    /**
     * 1단계: 키워드로 유튜브 쇼츠 검색 (영상 ID 목록 획득)
     */
    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> searchShorts(String keyword, int maxResults) {
        if ("MOCK_KEY".equals(apiKey) || apiKey == null || apiKey.isBlank()) {
            log.info("[MOCK] YouTube API Key 미설정으로 스텁 검색 데이터를 반환합니다. keyword={}", keyword);
            return getMockSearchResults(keyword);
        }

        try {
            URI uri = UriComponentsBuilder.fromHttpUrl(YOUTUBE_SEARCH_URL)
                    .queryParam("part", "snippet")
                    .queryParam("q", keyword + " #shorts")
                    .queryParam("type", "video")
                    .queryParam("videoDuration", "short")
                    .queryParam("maxResults", Math.min(maxResults, 50))
                    .queryParam("key", apiKey)
                    .build()
                    .toUri();

            Map<String, Object> response = restTemplate.getForObject(uri, Map.class);
            if (response != null && response.containsKey("items")) {
                return (List<Map<String, Object>>) response.get("items");
            }
        } catch (Exception e) {
            log.error("YouTube Search API 호출 실패 (keyword={}): {}", keyword, e.getMessage());
        }

        return Collections.emptyList();
    }

    /**
     * 2단계: 영상 ID 목록으로 실제 조회수, 재생시간, 태그 일괄 상세 조회
     */
    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> getVideoDetails(List<String> videoIds) {
        if (videoIds == null || videoIds.isEmpty()) {
            return Collections.emptyList();
        }

        if ("MOCK_KEY".equals(apiKey) || apiKey == null || apiKey.isBlank()) {
            return getMockVideoDetails(videoIds);
        }

        try {
            String idsParam = String.join(",", videoIds);
            URI uri = UriComponentsBuilder.fromHttpUrl(YOUTUBE_VIDEOS_URL)
                    .queryParam("part", "snippet,contentDetails,statistics,status")
                    .queryParam("id", idsParam)
                    .queryParam("key", apiKey)
                    .build()
                    .toUri();

            Map<String, Object> response = restTemplate.getForObject(uri, Map.class);
            if (response != null && response.containsKey("items")) {
                return (List<Map<String, Object>>) response.get("items");
            }
        } catch (Exception e) {
            log.error("YouTube Videos API 호출 실패: {}", e.getMessage());
        }

        return Collections.emptyList();
    }

    private static final String YOUTUBE_COMMENTS_URL = "https://www.googleapis.com/youtube/v3/commentThreads";

    /**
     * 3단계: 영상의 최상단/고정 댓글 조회 (레시피 정보 보강용)
     */
    @SuppressWarnings("unchecked")
    public String getTopComment(String videoId) {
        if ("MOCK_KEY".equals(apiKey) || apiKey == null || apiKey.isBlank() || videoId == null) {
            return null;
        }

        try {
            URI uri = UriComponentsBuilder.fromHttpUrl(YOUTUBE_COMMENTS_URL)
                    .queryParam("part", "snippet")
                    .queryParam("videoId", videoId)
                    .queryParam("maxResults", 3)
                    .queryParam("order", "relevance")
                    .queryParam("key", apiKey)
                    .build()
                    .toUri();

            Map<String, Object> response = restTemplate.getForObject(uri, Map.class);
            if (response != null && response.containsKey("items")) {
                List<Map<String, Object>> items = (List<Map<String, Object>>) response.get("items");
                if (!items.isEmpty()) {
                    StringBuilder commentsText = new StringBuilder();
                    for (Map<String, Object> item : items) {
                        Map<String, Object> snippet = (Map<String, Object>) item.get("snippet");
                        if (snippet != null) {
                            Map<String, Object> topComment = (Map<String, Object>) snippet.get("topLevelComment");
                            if (topComment != null) {
                                Map<String, Object> commentSnippet = (Map<String, Object>) topComment.get("snippet");
                                if (commentSnippet != null && commentSnippet.containsKey("textDisplay")) {
                                    String text = (String) commentSnippet.get("textDisplay");
                                    commentsText.append(text).append("\n");
                                }
                            }
                        }
                    }
                    return commentsText.toString();
                }
            }
        } catch (Exception e) {
            log.debug("유튜브 댓글 조회 건너뜀 (videoId={}): {}", videoId, e.getMessage());
        }

        return null;
    }

    private List<Map<String, Object>> getMockSearchResults(String keyword) {
        return List.of(
                Map.of(
                        "id", Map.of("videoId", "mock_egg_fried_rice"),
                        "snippet", Map.of(
                                "title", "[" + keyword + "] 5분컷 원팬 계란볶음밥 황금레시피 #자취요리 #간단요리",
                                "channelTitle", "자취요리왕",
                                "thumbnails", Map.of("high", Map.of("url", "https://img.youtube.com/vi/mock_egg_fried_rice/hqdefault.jpg"))
                        )
                ),
                Map.of(
                        "id", Map.of("videoId", "mock_spam_mayo"),
                        "snippet", Map.of(
                                "title", "[" + keyword + "] 실패 없는 스팸마요덮밥 초간단 1인분 #스팸요리 #혼밥",
                                "channelTitle", "혼밥마스터",
                                "thumbnails", Map.of("high", Map.of("url", "https://img.youtube.com/vi/mock_spam_mayo/hqdefault.jpg"))
                        )
                ),
                Map.of(
                        "id", Map.of("videoId", "mock_microwave_steamed"),
                        "snippet", Map.of(
                                "title", "[" + keyword + "] 전자레인지 3분 완성 대패삼겹 야채찜 #전자레인지 #초간단",
                                "channelTitle", "1인분연구소",
                                "thumbnails", Map.of("high", Map.of("url", "https://img.youtube.com/vi/mock_microwave_steamed/hqdefault.jpg"))
                        )
                )
        );
    }

    private List<Map<String, Object>> getMockVideoDetails(List<String> videoIds) {
        List<Map<String, Object>> list = new ArrayList<>();
        for (String id : videoIds) {
            list.add(Map.of(
                    "id", id,
                    "snippet", Map.of(
                            "title", "자취생 초간단 꿀맛 요리 #shorts",
                            "channelTitle", "자취요리왕",
                            "description", "자취생 필수 초간단 레시피입니다! #자취요리 #혼밥 #간단요리",
                            "tags", List.of("자취요리", "혼밥", "간단요리", "1인분"),
                            "thumbnails", Map.of("high", Map.of("url", "https://img.youtube.com/vi/" + id + "/hqdefault.jpg"))
                    ),
                    "contentDetails", Map.of("duration", "PT50S"),
                    "statistics", Map.of("viewCount", "150000", "likeCount", "5200"),
                    "status", Map.of("embeddable", true, "privacyStatus", "public")
            ));
        }
        return list;
    }
}
