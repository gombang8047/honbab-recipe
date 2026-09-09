package com.honbab.diary.domain.shorts.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "shorts")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Shorts {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "youtube_id", nullable = false, unique = true)
    private String youtubeId;

    @Column(nullable = false)
    private String title;

    @Column(name = "channel_name", nullable = false)
    private String channelName;

    @Column(name = "thumbnail_url")
    private String thumbnailUrl;

    @Column(name = "video_url")
    private String videoUrl;

    @Column(name = "duration_seconds")
    private Integer durationSeconds;

    @Column(name = "view_count")
    private Long viewCount;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private String metadata;

    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private ShortsStatus status = ShortsStatus.ACTIVE;

    @Column(name = "crawled_at")
    private LocalDateTime crawledAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "shorts_tag",
            joinColumns = @JoinColumn(name = "shorts_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id")
    )
    private Set<Tag> tags = new HashSet<>();

    @Builder
    public Shorts(String youtubeId, String title, String channelName,
                  String thumbnailUrl, String videoUrl, Integer durationSeconds,
                  Long viewCount, String metadata) {
        this.youtubeId = youtubeId;
        this.title = title;
        this.channelName = channelName;
        this.thumbnailUrl = thumbnailUrl;
        this.videoUrl = videoUrl;
        this.durationSeconds = durationSeconds;
        this.viewCount = viewCount;
        this.metadata = metadata;
        this.status = ShortsStatus.ACTIVE;
        this.crawledAt = LocalDateTime.now();
        this.createdAt = LocalDateTime.now();
    }

    public void addTag(Tag tag) {
        this.tags.add(tag);
    }

    public void deactivate() {
        this.status = ShortsStatus.INACTIVE;
    }

    public void activate() {
        this.status = ShortsStatus.ACTIVE;
    }

    public enum ShortsStatus {
        ACTIVE, INACTIVE, PROCESSING, ERROR
    }
}
