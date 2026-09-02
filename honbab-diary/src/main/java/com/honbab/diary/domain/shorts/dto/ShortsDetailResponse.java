package com.honbab.diary.domain.shorts.dto;

import com.honbab.diary.domain.shorts.entity.Shorts;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.stream.Collectors;

@Getter
@Builder
@AllArgsConstructor
public class ShortsDetailResponse {

    private Long id;
    private String youtubeId;
    private String title;
    private String channelName;
    private String thumbnailUrl;
    private String videoUrl;
    private Integer durationSeconds;
    private Long viewCount;
    private Set<String> tags;
    private boolean bookmarked;
    private boolean hasRecipe;
    private LocalDateTime crawledAt;

    public static ShortsDetailResponse from(Shorts shorts, boolean bookmarked, boolean hasRecipe) {
        return ShortsDetailResponse.builder()
                .id(shorts.getId())
                .youtubeId(shorts.getYoutubeId())
                .title(shorts.getTitle())
                .channelName(shorts.getChannelName())
                .thumbnailUrl(shorts.getThumbnailUrl())
                .videoUrl(shorts.getVideoUrl())
                .durationSeconds(shorts.getDurationSeconds())
                .viewCount(shorts.getViewCount())
                .tags(shorts.getTags().stream()
                        .map(tag -> tag.getName())
                        .collect(Collectors.toSet()))
                .bookmarked(bookmarked)
                .hasRecipe(hasRecipe)
                .crawledAt(shorts.getCrawledAt())
                .build();
    }
}
