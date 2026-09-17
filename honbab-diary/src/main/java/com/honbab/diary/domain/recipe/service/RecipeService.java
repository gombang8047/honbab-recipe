package com.honbab.diary.domain.recipe.service;

import com.honbab.diary.domain.recipe.dto.RecipeDetailResponse;
import com.honbab.diary.domain.recipe.dto.RecipeResponse;
import com.honbab.diary.domain.recipe.entity.Recipe;
import com.honbab.diary.domain.recipe.repository.RecipeRepository;
import com.honbab.diary.global.exception.BusinessException;
import com.honbab.diary.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RecipeService {

    private final RecipeRepository recipeRepository;

    /**
     * 레시피 상세 조회
     */
    public RecipeDetailResponse getRecipeDetail(Long recipeId) {
        Recipe recipe = recipeRepository.findById(recipeId)
                .or(() -> recipeRepository.findByShortsId(recipeId))
                .orElseThrow(() -> new BusinessException(ErrorCode.RECIPE_NOT_FOUND));
        return RecipeDetailResponse.from(recipe);
    }

    /**
     * 쇼츠에 연결된 레시피 조회
     */
    public RecipeDetailResponse getRecipeByShortsId(Long shortsId) {
        Recipe recipe = recipeRepository.findByShortsId(shortsId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RECIPE_NOT_FOUND));
        return RecipeDetailResponse.from(recipe);
    }

    /**
     * 레시피 검색
     */
    public Page<RecipeResponse> searchRecipes(String keyword, Pageable pageable) {
        return recipeRepository.searchByKeyword(keyword, pageable)
                .map(RecipeResponse::from);
    }

    /**
     * 재료 목록 조회
     */
    public RecipeDetailResponse getRecipeIngredients(Long recipeId) {
        Recipe recipe = recipeRepository.findById(recipeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RECIPE_NOT_FOUND));
        return RecipeDetailResponse.from(recipe);
    }
}
