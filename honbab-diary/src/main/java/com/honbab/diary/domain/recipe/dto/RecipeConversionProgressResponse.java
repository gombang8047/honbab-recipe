package com.honbab.diary.domain.recipe.dto;

/** IDLE means no active job on this server, not that conversion has succeeded. */
public record RecipeConversionProgressResponse(Stage stage, long elapsedMs) {
    public enum Stage { IDLE, PREPARING, COMMENTS, ANALYZING, SAVING }
}
