package com.honbab.diary.domain.recipe.entity;

import com.honbab.diary.domain.shorts.entity.Shorts;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "recipe")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Recipe {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shorts_id", nullable = false, unique = true)
    private Shorts shorts;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "serving_size")
    private Integer servingSize;

    @Column(name = "prep_time_minutes")
    private Integer prepTimeMinutes;

    @Column(name = "cook_time_minutes")
    private Integer cookTimeMinutes;

    @Column(length = 20)
    @Enumerated(EnumType.STRING)
    private Difficulty difficulty;

    @Column(name = "estimated_cost")
    private Integer estimatedCost;

    @Column(name = "nutrition_info", columnDefinition = "jsonb")
    private String nutritionInfo;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "recipe", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("stepOrder ASC")
    private List<RecipeStep> steps = new ArrayList<>();

    @OneToMany(mappedBy = "recipe", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RecipeIngredient> ingredients = new ArrayList<>();

    @Builder
    public Recipe(Shorts shorts, String title, String description,
                  Integer servingSize, Integer prepTimeMinutes, Integer cookTimeMinutes,
                  Difficulty difficulty, Integer estimatedCost, String nutritionInfo) {
        this.shorts = shorts;
        this.title = title;
        this.description = description;
        this.servingSize = servingSize;
        this.prepTimeMinutes = prepTimeMinutes;
        this.cookTimeMinutes = cookTimeMinutes;
        this.difficulty = difficulty;
        this.estimatedCost = estimatedCost;
        this.nutritionInfo = nutritionInfo;
        this.createdAt = LocalDateTime.now();
    }

    public void addStep(RecipeStep step) {
        this.steps.add(step);
    }

    public void addIngredient(RecipeIngredient ingredient) {
        this.ingredients.add(ingredient);
    }

    public enum Difficulty {
        EASY, MEDIUM, HARD
    }
}
