package com.honbab.diary.domain.recipe.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.honbab.diary.domain.recipe.dto.RecipeDetailResponse;
import com.honbab.diary.domain.recipe.entity.Ingredient;
import com.honbab.diary.domain.recipe.entity.Recipe;
import com.honbab.diary.domain.recipe.entity.RecipeIngredient;
import com.honbab.diary.domain.recipe.entity.RecipeStep;
import com.honbab.diary.domain.recipe.repository.IngredientRepository;
import com.honbab.diary.domain.recipe.repository.RecipeRepository;
import com.honbab.diary.domain.shorts.entity.Shorts;
import com.honbab.diary.domain.shorts.service.ShortsService;
import com.honbab.diary.global.exception.BusinessException;
import com.honbab.diary.global.exception.ErrorCode;
import com.honbab.diary.infra.gemini.GeminiApiClient;
import com.honbab.diary.infra.gemini.GeminiPromptBuilder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiRecipeService {

    private final ShortsService shortsService;
    private final RecipeRepository recipeRepository;
    private final IngredientRepository ingredientRepository;
    private final GeminiApiClient geminiApiClient;
    private final GeminiPromptBuilder geminiPromptBuilder;
    private final ObjectMapper objectMapper;

    /**
     * 쇼츠를 AI로 분석하여 1인분 레시피로 변환
     * 1. DB 캐시 확인 (이미 변환된 레시피가 있으면 0초 즉시 반환)
     * 2. 없으면 쇼츠 제목, 설명란, 태그 추출
     * 3. Google Gemini 1.5 Flash로 정밀 레시피 JSON 생성
     * 4. PostgreSQL DB 영구 저장 후 반환
     */
    @Transactional
    public RecipeDetailResponse convertShortsToRecipe(Long shortsId) {
        // 1. DB 캐시 확인
        if (recipeRepository.existsByShortsId(shortsId)) {
            Recipe cached = recipeRepository.findByShortsId(shortsId).orElse(null);
            if (cached != null) {
                log.info("캐시된 AI 레시피 즉시 반환 (DB Hit): shortsId={}, recipeId={}", shortsId, cached.getId());
                return RecipeDetailResponse.from(cached);
            }
        }

        Shorts shorts = shortsService.findShortsById(shortsId);
        log.info("Google Gemini 1.5 Flash 레시피 변환 시작: shortsId={}, title={}", shortsId, shorts.getTitle());

        try {
            // 2. 쇼츠 메타데이터에서 설명란 및 태그 추출
            String title = shorts.getTitle();
            String description = null;
            Set<String> tags = new LinkedHashSet<>();

            if (shorts.getMetadata() != null && !shorts.getMetadata().isBlank()) {
                try {
                    JsonNode metaNode = objectMapper.readTree(shorts.getMetadata());
                    JsonNode snippet = metaNode.path("snippet");
                    if (!snippet.isMissingNode()) {
                        description = snippet.path("description").asText(null);
                        JsonNode tagsNode = snippet.path("tags");
                        if (tagsNode.isArray()) {
                            for (JsonNode t : tagsNode) {
                                tags.add(t.asText());
                            }
                        }
                    }
                } catch (Exception e) {
                    log.warn("쇼츠 메타데이터 파싱 경고 (기본 정보로 진행): {}", e.getMessage());
                }
            }

            // 3. Gemini 프롬프트 생성 및 호출
            String prompt = geminiPromptBuilder.buildRecipePrompt(title, description, tags);
            String geminiResponseJson = geminiApiClient.generateRecipeJson(prompt, title);

            // 4. JSON 파싱
            Map<String, Object> recipeData = objectMapper.readValue(
                    geminiResponseJson, new TypeReference<>() {});

            // 5. 엔티티 생성 및 DB 저장
            Recipe recipe = buildRecipeFromAiResponse(shorts, recipeData);
            Recipe saved = recipeRepository.save(recipe);

            log.info("Gemini 1.5 Flash 레시피 변환 및 DB 적재 완료: shortsId={}, recipeId={}", shortsId, saved.getId());
            return RecipeDetailResponse.from(saved);

        } catch (Exception e) {
            log.error("AI 레시피 변환 실패: shortsId={}", shortsId, e);
            throw new BusinessException(ErrorCode.AI_CONVERSION_FAILED,
                    "AI 레시피 변환에 실패했습니다: " + e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    private Recipe buildRecipeFromAiResponse(Shorts shorts, Map<String, Object> data) {
        String difficultyStr = (String) data.getOrDefault("difficulty", "EASY");
        Recipe.Difficulty difficulty;
        try {
            difficulty = Recipe.Difficulty.valueOf(difficultyStr.toUpperCase());
        } catch (Exception e) {
            difficulty = Recipe.Difficulty.EASY;
        }

        Recipe recipe = Recipe.builder()
                .shorts(shorts)
                .title((String) data.getOrDefault("title", shorts.getTitle()))
                .description((String) data.getOrDefault("description", "자취생을 위한 초간단 1인분 레시피"))
                .servingSize(((Number) data.getOrDefault("serving_size", 1)).intValue())
                .prepTimeMinutes(((Number) data.getOrDefault("prep_time_minutes", 3)).intValue())
                .cookTimeMinutes(((Number) data.getOrDefault("cook_time_minutes", 5)).intValue())
                .difficulty(difficulty)
                .estimatedCost(((Number) data.getOrDefault("estimated_cost", 3500)).intValue())
                .build();

        // 조리 단계 추가
        List<Map<String, Object>> steps = (List<Map<String, Object>>) data.get("steps");
        if (steps != null) {
            for (Map<String, Object> step : steps) {
                int order = ((Number) step.getOrDefault("order", 1)).intValue();
                String desc = (String) step.getOrDefault("description", "");
                if (desc.contains("\n💡")) {
                    desc = desc.substring(0, desc.indexOf("\n💡")).trim();
                }

                int timerSeconds = step.containsKey("timer_seconds")
                        ? ((Number) step.get("timer_seconds")).intValue()
                        : 0;

                recipe.addStep(RecipeStep.builder()
                        .recipe(recipe)
                        .stepOrder(order)
                        .description(desc)
                        .timerSeconds(timerSeconds)
                        .build());
            }
        }

        // 재료 추가
        List<Map<String, Object>> ingredients = (List<Map<String, Object>>) data.get("ingredients");
        if (ingredients != null) {
            for (Map<String, Object> ing : ingredients) {
                String ingredientName = (String) ing.getOrDefault("name", "기본 재료");
                Ingredient ingredient = ingredientRepository.findByName(ingredientName)
                        .orElseGet(() -> ingredientRepository.save(
                                Ingredient.builder().name(ingredientName).build()));

                recipe.addIngredient(RecipeIngredient.builder()
                        .recipe(recipe)
                        .ingredient(ingredient)
                        .amount(String.valueOf(ing.getOrDefault("amount", "1")))
                        .unit((String) ing.getOrDefault("unit", "개"))
                        .isEssential((Boolean) ing.getOrDefault("is_essential", true))
                        .build());
            }
        }

        return recipe;
    }
}
