package com.honbab.diary.domain.recipe.service;

import com.honbab.diary.domain.recipe.dto.RecipeDetailResponse;
import com.honbab.diary.domain.recipe.entity.*;
import com.honbab.diary.domain.recipe.repository.IngredientRepository;
import com.honbab.diary.domain.recipe.repository.RecipeRepository;
import com.honbab.diary.domain.shorts.entity.Shorts;
import com.honbab.diary.domain.shorts.service.ShortsService;
import com.honbab.diary.global.exception.BusinessException;
import com.honbab.diary.global.exception.ErrorCode;
import com.honbab.diary.infra.openai.GptPromptBuilder;
import com.honbab.diary.infra.openai.OpenAiClient;
import com.honbab.diary.infra.openai.WhisperClient;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiRecipeService {

    private final ShortsService shortsService;
    private final RecipeRepository recipeRepository;
    private final IngredientRepository ingredientRepository;
    private final OpenAiClient openAiClient;
    private final WhisperClient whisperClient;
    private final GptPromptBuilder gptPromptBuilder;
    private final ObjectMapper objectMapper;

    /**
     * 쇼츠를 AI로 레시피로 변환
     * 1. 이미 변환된 레시피가 있으면 캐시 반환
     * 2. 없으면 Whisper STT → GPT-4o 분석 → DB 저장
     */
    @Transactional
    public RecipeDetailResponse convertShortsToRecipe(Long shortsId) {
        // 캐시 확인
        if (recipeRepository.existsByShortsId(shortsId)) {
            Recipe cached = recipeRepository.findByShortsId(shortsId).get();
            log.info("캐시된 레시피 반환: shortsId={}, recipeId={}", shortsId, cached.getId());
            return RecipeDetailResponse.from(cached);
        }

        Shorts shorts = shortsService.findShortsById(shortsId);
        log.info("AI 레시피 변환 시작: shortsId={}, title={}", shortsId, shorts.getTitle());

        try {
            // 1. Whisper STT: 오디오 → 텍스트
            String transcript = whisperClient.transcribe(shorts.getVideoUrl());
            log.debug("STT 완료: {} 글자", transcript.length());

            // 2. GPT 프롬프트 생성 및 호출
            String prompt = gptPromptBuilder.buildRecipePrompt(transcript, shorts.getTitle());
            String gptResponse = openAiClient.chat(prompt);

            // 3. JSON 파싱
            Map<String, Object> recipeData = objectMapper.readValue(gptResponse, new TypeReference<>() {});

            // 4. 엔티티 생성 및 저장
            Recipe recipe = buildRecipeFromAiResponse(shorts, recipeData);
            recipeRepository.save(recipe);

            log.info("AI 레시피 변환 완료: shortsId={}, recipeId={}", shortsId, recipe.getId());
            return RecipeDetailResponse.from(recipe);

        } catch (Exception e) {
            log.error("AI 레시피 변환 실패: shortsId={}", shortsId, e);
            throw new BusinessException(ErrorCode.AI_CONVERSION_FAILED,
                    "AI 레시피 변환에 실패했습니다: " + e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    private Recipe buildRecipeFromAiResponse(Shorts shorts, Map<String, Object> data) {
        Recipe recipe = Recipe.builder()
                .shorts(shorts)
                .title((String) data.get("title"))
                .description((String) data.get("description"))
                .servingSize((Integer) data.getOrDefault("serving_size", 1))
                .prepTimeMinutes((Integer) data.get("prep_time_minutes"))
                .cookTimeMinutes((Integer) data.get("cook_time_minutes"))
                .difficulty(Recipe.Difficulty.valueOf((String) data.getOrDefault("difficulty", "EASY")))
                .estimatedCost((Integer) data.get("estimated_cost"))
                .build();

        // 조리 단계 추가
        List<Map<String, Object>> steps = (List<Map<String, Object>>) data.get("steps");
        if (steps != null) {
            for (Map<String, Object> step : steps) {
                recipe.addStep(RecipeStep.builder()
                        .recipe(recipe)
                        .stepOrder((Integer) step.get("order"))
                        .description((String) step.get("description"))
                        .timerSeconds((Integer) step.get("timer_seconds"))
                        .build());
            }
        }

        // 재료 추가
        List<Map<String, Object>> ingredients = (List<Map<String, Object>>) data.get("ingredients");
        if (ingredients != null) {
            for (Map<String, Object> ing : ingredients) {
                String ingredientName = (String) ing.get("name");
                Ingredient ingredient = ingredientRepository.findByName(ingredientName)
                        .orElseGet(() -> ingredientRepository.save(
                                Ingredient.builder().name(ingredientName).build()));

                recipe.addIngredient(RecipeIngredient.builder()
                        .recipe(recipe)
                        .ingredient(ingredient)
                        .amount((String) ing.get("amount"))
                        .unit((String) ing.get("unit"))
                        .isEssential((Boolean) ing.getOrDefault("is_essential", true))
                        .build());
            }
        }

        return recipe;
    }
}
