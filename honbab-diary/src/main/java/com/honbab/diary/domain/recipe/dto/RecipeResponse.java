package com.honbab.diary.domain.recipe.dto;

import com.honbab.diary.domain.recipe.entity.Recipe;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class RecipeResponse {

    private Long id;
    private Long shortsId;
    private String title;
    private String description;
    private Integer servingSize;
    private Integer prepTimeMinutes;
    private Integer cookTimeMinutes;
    private String difficulty;
    private Integer estimatedCost;
    private String shortsThumbnailUrl;

    public static RecipeResponse from(Recipe recipe) {
        return RecipeResponse.builder()
                .id(recipe.getId())
                .shortsId(recipe.getShorts().getId())
                .title(recipe.getTitle())
                .description(recipe.getDescription())
                .servingSize(recipe.getServingSize())
                .prepTimeMinutes(recipe.getPrepTimeMinutes())
                .cookTimeMinutes(recipe.getCookTimeMinutes())
                .difficulty(recipe.getDifficulty() != null ? recipe.getDifficulty().name() : null)
                .estimatedCost(recipe.getEstimatedCost())
                .shortsThumbnailUrl(recipe.getShorts().getThumbnailUrl())
                .build();
    }
}
