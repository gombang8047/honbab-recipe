package com.honbab.diary.domain.shorts.entity;

import com.honbab.diary.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_recipe_bookmark",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "shorts_id"}))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserRecipeBookmark {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shorts_id", nullable = false)
    private Shorts shorts;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public UserRecipeBookmark(User user, Shorts shorts) {
        this.user = user;
        this.shorts = shorts;
        this.createdAt = LocalDateTime.now();
    }
}
