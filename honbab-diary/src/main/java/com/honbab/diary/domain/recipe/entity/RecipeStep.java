package com.honbab.diary.domain.recipe.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "recipe_step")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RecipeStep {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipe_id", nullable = false)
    private Recipe recipe;

    @Column(name = "step_order", nullable = false)
    private Integer stepOrder;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "timer_seconds")
    private Integer timerSeconds;

    @Builder
    public RecipeStep(Recipe recipe, Integer stepOrder, String description,
                      String imageUrl, Integer timerSeconds) {
        this.recipe = recipe;
        this.stepOrder = stepOrder;
        this.description = description;
        this.imageUrl = imageUrl;
        this.timerSeconds = timerSeconds;
    }
}
