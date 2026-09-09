package com.honbab.diary.infra.youtube;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.honbab.diary.domain.shorts.entity.Shorts;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Component
@RequiredArgsConstructor
public class YoutubeDataParser {

    private final ObjectMapper objectMapper;
    private static final Pattern HASHTAG_PATTERN = Pattern.compile("#([가-힣a-zA-Z0-9_]{1,30})");

    /**
     * Search 응답 또는 Video 상세 응답에서 videoId 추출
     */
    @SuppressWarnings("unchecked")
    public String extractYoutubeId(Map<String, Object> item) {
        Object idObj = item.get("id");
        if (idObj instanceof String) {
            return (String) idObj;
        } else if (idObj instanceof Map) {
            Map<String, Object> idMap = (Map<String, Object>) idObj;
            return (String) idMap.get("videoId");
        }
        return null;
    }

    /**
     * Video 상세 정보 Map을 Shorts 엔티티로 변환
     */
    @SuppressWarnings("unchecked")
    public Shorts parseToShorts(Map<String, Object> videoItem) {
        String videoId = extractYoutubeId(videoItem);
        Map<String, Object> snippet = (Map<String, Object>) videoItem.getOrDefault("snippet", Collections.emptyMap());
        Map<String, Object> contentDetails = (Map<String, Object>) videoItem.getOrDefault("contentDetails", Collections.emptyMap());
        Map<String, Object> statistics = (Map<String, Object>) videoItem.getOrDefault("statistics", Collections.emptyMap());

        String title = (String) snippet.getOrDefault("title", "제목 없음");
        String channelTitle = (String) snippet.getOrDefault("channelTitle", "알 수 없는 채널");

        // 썸네일 URL 추출 (maxres > standard > high > medium > default)
        String thumbnailUrl = extractThumbnailUrl(snippet);

        // 재생 시간 (초)
        int durationSeconds = 60;
        if (contentDetails.containsKey("duration")) {
            durationSeconds = parseIsoDuration((String) contentDetails.get("duration"));
        }

        // 실제 조회수
        long viewCount = 0L;
        if (statistics.containsKey("viewCount")) {
            try {
                viewCount = Long.parseLong(String.valueOf(statistics.get("viewCount")));
            } catch (NumberFormatException e) {
                viewCount = 0L;
            }
        }

        // 원본 메타데이터 JSON 직렬화
        String metadataJson = null;
        try {
            metadataJson = objectMapper.writeValueAsString(videoItem);
        } catch (Exception e) {
            log.warn("메타데이터 JSON 변환 실패: {}", e.getMessage());
        }

        return Shorts.builder()
                .youtubeId(videoId)
                .title(title)
                .channelName(channelTitle)
                .thumbnailUrl(thumbnailUrl)
                .videoUrl("https://www.youtube.com/shorts/" + videoId)
                .durationSeconds(durationSeconds)
                .viewCount(viewCount)
                .metadata(metadataJson)
                .build();
    }

    /**
     * 외부 웹사이트 퍼가기/재생 가능 여부 확인 (status.embeddable 및 privacyStatus)
     * - embeddable이 false이면 웹사이트 iframe에서 재생 불가 (오류 150/101)
     * - privacyStatus가 private이면 비공개 영상이므로 재생 불가
     */
    @SuppressWarnings("unchecked")
    public boolean isEmbeddable(Map<String, Object> videoItem) {
        if (videoItem == null) {
            return false;
        }

        Map<String, Object> status = (Map<String, Object>) videoItem.get("status");
        if (status == null) {
            return true;
        }

        Object privacyStatus = status.get("privacyStatus");
        if (privacyStatus instanceof String && "private".equalsIgnoreCase((String) privacyStatus)) {
            return false;
        }

        Object embeddable = status.get("embeddable");
        if (embeddable instanceof Boolean) {
            return (Boolean) embeddable;
        }

        return true;
    }

    /**
     * 영상 태그 및 제목/설명란 해시태그 일괄 추출
     */
    @SuppressWarnings("unchecked")
    public Set<String> extractTags(Map<String, Object> videoItem) {
        Set<String> tagSet = new LinkedHashSet<>();
        Map<String, Object> snippet = (Map<String, Object>) videoItem.getOrDefault("snippet", Collections.emptyMap());

        // 1. 공식 tags 필드 수집
        Object tagsObj = snippet.get("tags");
        if (tagsObj instanceof List) {
            List<String> tags = (List<String>) tagsObj;
            for (String tag : tags) {
                String cleaned = cleanTagName(tag);
                if (isValidTag(cleaned)) {
                    tagSet.add(cleaned);
                }
            }
        }

        // 2. 제목에서 해시태그 추출 (#자취요리 등)
        String title = (String) snippet.getOrDefault("title", "");
        extractHashtags(title, tagSet);

        // 3. 설명문에서 해시태그 추출
        String description = (String) snippet.getOrDefault("description", "");
        extractHashtags(description, tagSet);

        return tagSet;
    }

    @SuppressWarnings("unchecked")
    private String extractThumbnailUrl(Map<String, Object> snippet) {
        Map<String, Object> thumbnails = (Map<String, Object>) snippet.get("thumbnails");
        if (thumbnails == null || thumbnails.isEmpty()) {
            return null;
        }

        String[] priorities = {"maxres", "standard", "high", "medium", "default"};
        for (String key : priorities) {
            if (thumbnails.containsKey(key)) {
                Map<String, Object> thumb = (Map<String, Object>) thumbnails.get(key);
                if (thumb != null && thumb.containsKey("url")) {
                    return (String) thumb.get("url");
                }
            }
        }
        return null;
    }

    /**
     * ISO-8601 Duration (예: PT48S, PT1M10S) -> 초 단위 정수 변환
     */
    public int parseIsoDuration(String isoDuration) {
        if (isoDuration == null || isoDuration.isBlank()) {
            return 60;
        }
        try {
            return (int) Duration.parse(isoDuration).getSeconds();
        } catch (Exception e) {
            log.debug("ISO Duration 파싱 실패 ({}), 기본값 60초 적용", isoDuration);
            return 60;
        }
    }

    private void extractHashtags(String text, Set<String> tagSet) {
        if (text == null || text.isBlank()) {
            return;
        }
        Matcher matcher = HASHTAG_PATTERN.matcher(text);
        while (matcher.find()) {
            String tag = matcher.group(1);
            String cleaned = cleanTagName(tag);
            if (isValidTag(cleaned)) {
                tagSet.add(cleaned);
            }
        }
    }

    private String cleanTagName(String tag) {
        if (tag == null) return "";
        return tag.replace("#", "").trim();
    }

    private boolean isValidTag(String tag) {
        return !tag.isBlank() && tag.length() <= 50 && !tag.equalsIgnoreCase("shorts");
    }
}
