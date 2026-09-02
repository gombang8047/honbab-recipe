package com.honbab.diary.infra.youtube;

import com.honbab.diary.domain.shorts.entity.Shorts;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class YoutubeDataParser {

    @SuppressWarnings("unchecked")
    public String extractYoutubeId(Map<String, Object> item) {
        Map<String, Object> idMap = (Map<String, Object>) item.get("id");
        return (String) idMap.get("videoId");
    }

    @SuppressWarnings("unchecked")
    public Shorts parseToShorts(Map<String, Object> item) {
        String videoId = extractYoutubeId(item);
        Map<String, Object> snippet = (Map<String, Object>) item.get("snippet");

        String title = (String) snippet.get("title");
        String channelTitle = (String) snippet.get("channelTitle");

        String thumbnailUrl = "";
        Map<String, Object> thumbnails = (Map<String, Object>) snippet.get("thumbnails");
        if (thumbnails != null && thumbnails.containsKey("high")) {
            Map<String, Object> high = (Map<String, Object>) thumbnails.get("high");
            thumbnailUrl = (String) high.get("url");
        }

        return Shorts.builder()
                .youtubeId(videoId)
                .title(title)
                .channelName(channelTitle)
                .thumbnailUrl(thumbnailUrl)
                .videoUrl("https://www.youtube.com/shorts/" + videoId)
                .durationSeconds(60)
                .viewCount(1000L)
                .build();
    }
}
