package com.honbab.diary.domain.recipe.controller;

import com.honbab.diary.domain.recipe.dto.RecipeDetailResponse;
import com.honbab.diary.domain.recipe.dto.RecipeResponse;
import com.honbab.diary.domain.recipe.service.AiRecipeService;
import com.honbab.diary.domain.recipe.service.RecipeService;
import com.honbab.diary.global.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Tag(name = "레시피", description = "AI 레시피 변환 / 검색 / 조회 API")
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class RecipeController {

    private final RecipeService recipeService;
    private final AiRecipeService aiRecipeService;

    @Operation(summary = "AI 레시피 변환", description = "쇼츠 영상을 AI로 분석하여 구조화된 레시피를 생성합니다.")
    @PostMapping("/shorts/{shortsId}/recipe")
    public ResponseEntity<ApiResponse<RecipeDetailResponse>> convertToRecipe(
            @PathVariable Long shortsId) {
        RecipeDetailResponse response = aiRecipeService.convertShortsToRecipe(shortsId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @Operation(summary = "레시피 상세 조회", description = "레시피의 상세 정보를 조회합니다.")
    @GetMapping("/recipes/{id}")
    public ResponseEntity<ApiResponse<RecipeDetailResponse>> getRecipeDetail(
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(recipeService.getRecipeDetail(id)));
    }

    @Operation(summary = "재료 목록 조회", description = "레시피의 재료 목록을 조회합니다.")
    @GetMapping("/recipes/{id}/ingredients")
    public ResponseEntity<ApiResponse<RecipeDetailResponse>> getIngredients(
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(recipeService.getRecipeIngredients(id)));
    }

    @Operation(summary = "레시피 검색", description = "키워드로 레시피를 검색합니다.")
    @GetMapping("/recipes/search")
    public ResponseEntity<ApiResponse<Page<RecipeResponse>>> searchRecipes(
            @RequestParam String keyword,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(recipeService.searchRecipes(keyword, pageable)));
    }
}
