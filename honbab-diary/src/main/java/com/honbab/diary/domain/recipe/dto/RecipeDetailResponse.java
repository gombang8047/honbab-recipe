package com.honbab.diary.domain.recipe.dto;

import com.honbab.diary.domain.recipe.entity.Recipe;
import com.honbab.diary.domain.recipe.entity.RecipeIngredient;
import com.honbab.diary.domain.recipe.entity.RecipeStep;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Getter
@Builder
@AllArgsConstructor
public class RecipeDetailResponse {

    private Long id;
    private Long shortsId;
    private String shortsYoutubeId;
    private String title;
    private String description;
    private Integer servingSize;
    private Integer prepTimeMinutes;
    private Integer cookTimeMinutes;
    private String difficulty;
    private Integer estimatedCost;
    private List<StepDto> steps;
    private List<IngredientDto> ingredients;
    private LocalDateTime createdAt;

    @Getter
    @Builder
    @AllArgsConstructor
    public static class StepDto {
        private Integer order;
        private String description;
        private String imageUrl;
        private Integer timerSeconds;

        public static StepDto from(RecipeStep step) {
            return StepDto.builder()
                    .order(step.getStepOrder())
                    .description(step.getDescription())
                    .imageUrl(step.getImageUrl())
                    .timerSeconds(step.getTimerSeconds())
                    .build();
        }
    }

    @Getter
    @Builder
    @AllArgsConstructor
    public static class IngredientDto {
        private Long ingredientId;
        private String name;
        private String amount;
        private String unit;
        private boolean isEssential;

        public static IngredientDto from(RecipeIngredient ri) {
            return IngredientDto.builder()
                    .ingredientId(ri.getIngredient().getId())
                    .name(ri.getIngredient().getName())
                    .amount(ri.getAmount())
                    .unit(ri.getUnit())
                    .isEssential(ri.getIsEssential())
                    .build();
        }
    }

    public static RecipeDetailResponse from(Recipe recipe) {
        return RecipeDetailResponse.builder()
                .id(recipe.getId())
                .shortsId(recipe.getShorts().getId())
                .shortsYoutubeId(recipe.getShorts().getYoutubeId())
                .title(recipe.getTitle())
                .description(recipe.getDescription())
                .servingSize(recipe.getServingSize())
                .prepTimeMinutes(recipe.getPrepTimeMinutes())
                .cookTimeMinutes(recipe.getCookTimeMinutes())
                .difficulty(recipe.getDifficulty() != null ? recipe.getDifficulty().name() : null)
                .estimatedCost(recipe.getEstimatedCost())
                .steps(recipe.getSteps().stream()
                        .map(StepDto::from)
                        .collect(Collectors.toList()))
                .ingredients(recipe.getIngredients().stream()
                        .map(IngredientDto::from)
                        .collect(Collectors.toList()))
                .createdAt(recipe.getCreatedAt())
                .build();
    }
}
