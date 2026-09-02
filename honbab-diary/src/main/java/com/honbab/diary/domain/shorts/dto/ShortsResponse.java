package com.honbab.diary.domain.shorts.dto;

import com.honbab.diary.domain.shorts.entity.Shorts;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Getter
@Builder
@AllArgsConstructor
public class ShortsResponse {

    private Long id;
    private String youtubeId;
    private String title;
    private String channelName;
    private String thumbnailUrl;
    private Integer durationSeconds;
    private Long viewCount;
    private Set<String> tags;
    private boolean bookmarked;

    public static ShortsResponse from(Shorts shorts) {
        return from(shorts, false);
    }

    public static ShortsResponse from(Shorts shorts, boolean bookmarked) {
        return ShortsResponse.builder()
                .id(shorts.getId())
                .youtubeId(shorts.getYoutubeId())
                .title(shorts.getTitle())
                .channelName(shorts.getChannelName())
                .thumbnailUrl(shorts.getThumbnailUrl())
                .durationSeconds(shorts.getDurationSeconds())
                .viewCount(shorts.getViewCount())
                .tags(shorts.getTags().stream()
                        .map(tag -> tag.getName())
                        .collect(Collectors.toSet()))
                .bookmarked(bookmarked)
                .build();
    }
}
