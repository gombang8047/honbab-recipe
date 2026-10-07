package com.honbab.diary.domain.recipe.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.honbab.diary.domain.recipe.dto.RecipeDetailResponse;
import com.honbab.diary.domain.recipe.dto.RecipeConversionProgressResponse;
import com.honbab.diary.domain.recipe.dto.RecipeConversionProgressResponse.Stage;
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
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutionException;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiRecipeService {

    private final ShortsService shortsService;
    private final RecipeRepository recipeRepository;
    private final IngredientRepository ingredientRepository;
    private final GeminiApiClient geminiApiClient;
    private final GeminiPromptBuilder geminiPromptBuilder;
    private final com.honbab.diary.infra.youtube.YoutubeApiClient youtubeApiClient;
    private final ObjectMapper objectMapper;
    private final PlatformTransactionManager transactionManager;

    // Single-flight is local to this application instance. Completed/failed entries are removed.
    private final ConcurrentHashMap<Long, ConversionJob> inFlight = new ConcurrentHashMap<>();

    private static final class ConversionJob {
        private final CompletableFuture<RecipeDetailResponse> result = new CompletableFuture<>();
        private final long startedAt = System.nanoTime();
        private volatile Stage stage = Stage.PREPARING;
    }

    public RecipeConversionProgressResponse getConversionProgress(Long shortsId) {
        ConversionJob job = inFlight.get(shortsId);
        if (job == null) return new RecipeConversionProgressResponse(Stage.IDLE, 0);
        return new RecipeConversionProgressResponse(job.stage, (System.nanoTime() - job.startedAt) / 1_000_000);
    }

    /**
     * 쇼츠를 AI로 분석하여 1인분 레시피로 변환
     * 1. 동일 쇼츠의 겹친 요청을 통합하고 짧은 트랜잭션에서 DB 캐시 확인
     * 2. 없으면 쇼츠 영상 URL과 제목, 설명란, 태그, 댓글 수집
     * 3. Google Gemini 멀티모달 분석으로 구조화된 레시피 JSON 생성
     * 4. 영상 분석 실패 시 텍스트 기반 분석으로 자동 전환
     * 5. PostgreSQL DB 영구 저장 후 반환
     */
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public RecipeDetailResponse convertShortsToRecipe(Long shortsId) {
        ConversionJob job = new ConversionJob();
        ConversionJob existing = inFlight.putIfAbsent(shortsId, job);
        if (existing != null) {
            log.info("진행 중인 AI 레시피 변환 결과 공유: shortsId={}", shortsId);
            return awaitResult(existing.result);
        }

        try {
            RecipeDetailResponse response = generateAndSave(shortsId, job);
            job.result.complete(response);
            return response;
        } catch (RuntimeException | Error e) {
            job.result.completeExceptionally(e);
            throw e;
        } finally {
            inFlight.remove(shortsId, job);
        }
    }

    private RecipeDetailResponse awaitResult(CompletableFuture<RecipeDetailResponse> result) {
        try {
            return result.get();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new BusinessException(ErrorCode.AI_CONVERSION_FAILED, "레시피 변환 결과 대기가 중단됐습니다.");
        } catch (ExecutionException e) {
            if (e.getCause() instanceof RuntimeException cause) throw cause;
            if (e.getCause() instanceof Error cause) throw cause;
            throw new BusinessException(ErrorCode.AI_CONVERSION_FAILED, "레시피 변환에 실패했습니다.");
        }
    }

    private RecipeDetailResponse generateAndSave(Long shortsId, ConversionJob job) {
        ConversionInput input = transaction(true).execute(status -> {
            RecipeDetailResponse cached = findCached(shortsId);
            if (cached != null) return new ConversionInput(null, null, null, cached);
            Shorts shorts = shortsService.findShortsById(shortsId);
            // Materialize scalar values before leaving the transaction; do not carry lazy entities.
            return new ConversionInput(shorts.getYoutubeId(), shorts.getTitle(), shorts.getMetadata(), null);
        });
        Objects.requireNonNull(input);
        if (input.cached() != null) return input.cached();
        log.info("Google Gemini 레시피 변환 시작: shortsId={}, title={}", shortsId, input.title());

        try {
            // 2. 쇼츠 메타데이터에서 설명란 및 태그 추출
            String title = input.title();
            String description = null;
            Set<String> tags = new LinkedHashSet<>();

            if (input.metadata() != null && !input.metadata().isBlank()) {
                try {
                    JsonNode metaNode = objectMapper.readTree(input.metadata());
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

            // 3. 관련도 상위 댓글 조회
            job.stage = Stage.COMMENTS;
            String comments = youtubeApiClient.getTopComment(input.youtubeId());

            // 4. Gemini 영상+텍스트 분석 호출 (영상 분석 실패 시 클라이언트에서 텍스트 방식으로 폴백)
            String prompt = geminiPromptBuilder.buildRecipePrompt(title, description, comments, tags);
            job.stage = Stage.ANALYZING;
            long geminiStartedAt = System.nanoTime();
            String geminiResponseJson = geminiApiClient.generateRecipeJson(prompt, input.youtubeId(), title);
            long geminiElapsedMs = (System.nanoTime() - geminiStartedAt) / 1_000_000;
            log.info("Gemini 레시피 분석 완료: shortsId={}, elapsedMs={}", shortsId, geminiElapsedMs);

            // 4. JSON 파싱
            job.stage = Stage.SAVING;
            Map<String, Object> recipeData = objectMapper.readValue(
                    geminiResponseJson, new TypeReference<>() {});

            // 5. 엔티티 생성 및 DB 저장
            return saveResult(shortsId, recipeData);

        } catch (BusinessException be) {
            log.error("AI 레시피 변환 실패: shortsId={}, error={}", shortsId, be.getMessage());
            throw be;
        } catch (Exception e) {
            log.error("AI 레시피 변환 실패: shortsId={}, error={}", shortsId, e.getMessage(), e);
            throw new BusinessException(ErrorCode.AI_CONVERSION_FAILED,
                    "AI 레시피 변환에 실패했습니다: " + e.getMessage());
        }
    }

    private RecipeDetailResponse saveResult(Long shortsId, Map<String, Object> recipeData) {
        try {
            return transaction(false).execute(status -> {
                // Another application instance may have saved a recipe during the external call.
                RecipeDetailResponse cached = findCached(shortsId);
                if (cached != null) return cached;
                Shorts shorts = shortsService.findShortsById(shortsId);
                Recipe saved = recipeRepository.saveAndFlush(buildRecipeFromAiResponse(shorts, recipeData));
                log.info("Gemini 레시피 변환 및 DB 적재 완료: shortsId={}, recipeId={}", shortsId, saved.getId());
                return RecipeDetailResponse.from(saved);
            });
        } catch (DataIntegrityViolationException e) {
            // The failed transaction has rolled back. Read the unique-key winner in a new transaction.
            RecipeDetailResponse cached = transaction(true).execute(status -> findCached(shortsId));
            if (cached != null) return cached;
            throw e;
        }
    }

    private RecipeDetailResponse findCached(Long shortsId) {
        return recipeRepository.findByShortsId(shortsId).map(RecipeDetailResponse::from).orElse(null);
    }

    private TransactionTemplate transaction(boolean readOnly) {
        TransactionTemplate template = new TransactionTemplate(transactionManager);
        template.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        template.setReadOnly(readOnly);
        return template;
    }

    private record ConversionInput(String youtubeId, String title, String metadata, RecipeDetailResponse cached) {}

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
