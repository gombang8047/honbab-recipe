package com.honbab.diary.domain.cart.service;

import com.honbab.diary.domain.cart.entity.ProductMapping;
import com.honbab.diary.domain.cart.repository.ProductMappingRepository;
import com.honbab.diary.domain.recipe.entity.Ingredient;
import com.honbab.diary.domain.recipe.repository.IngredientRepository;
import com.honbab.diary.infra.shopping.KurlyApiClient;
import lombok.Builder;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class ShoppingPriceService {

    private final KurlyApiClient kurlyApiClient;
    private final ProductMappingRepository productMappingRepository;
    private final IngredientRepository ingredientRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String REDIS_KEY_PREFIX = "kurly:price:";
    private static final String PLATFORM_KURLY = "KURLY";
    private static final Duration CACHE_TTL = Duration.ofHours(24);

    // 혼밥/자취 요리에 가장 빈번하게 쓰이는 25대 핵심 식재료 키워드
    public static final List<String> CORE_INGREDIENTS = List.of(
            "계란", "대파", "양파", "다진마늘", "두부", "삼겹살", "찌개용 돼지고기", "소고기",
            "김치", "스팸", "참치캔", "진간장", "고추장", "된장", "참기름", "식용유",
            "햇반", "라면", "감자", "청양고추", "버섯", "당근", "치즈", "우유", "버터"
    );

    @Getter
    @Builder
    public static class IngredientPriceDto {
        private String ingredientName;
        private String productName;
        private Integer packagePrice; // 컬리 실제 판매가 (패키지 가격)
        private String productUrl;
        private String thumbnailUrl;
        private String lastSyncedAt;
    }

    /**
     * 특정 식재료의 컬리 최신 가격 조회 (Redis 캐시 우선 -> DB -> 외부 API)
     */
    public Optional<IngredientPriceDto> getIngredientPrice(String ingredientName) {
        String cacheKey = REDIS_KEY_PREFIX + ingredientName;

        // 1. Redis 캐시 확인
        try {
            Object cached = redisTemplate.opsForValue().get(cacheKey);
            if (cached instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> map = (Map<String, Object>) cached;
                return Optional.of(IngredientPriceDto.builder()
                        .ingredientName(ingredientName)
                        .productName((String) map.get("productName"))
                        .packagePrice((Integer) map.get("packagePrice"))
                        .productUrl((String) map.get("productUrl"))
                        .thumbnailUrl((String) map.get("thumbnailUrl"))
                        .lastSyncedAt((String) map.get("lastSyncedAt"))
                        .build());
            }
        } catch (Exception e) {
            log.warn("Redis 가격 캐시 조회 실패, DB 조회를 시도합니다: {}", e.getMessage());
        }

        // 2. DB 확인
        Optional<Ingredient> ingOpt = ingredientRepository.findByName(ingredientName);
        if (ingOpt.isPresent()) {
            Optional<ProductMapping> mappingOpt = productMappingRepository
                    .findByIngredientIdAndPlatform(ingOpt.get().getId(), PLATFORM_KURLY);
            if (mappingOpt.isPresent()) {
                ProductMapping pm = mappingOpt.get();
                IngredientPriceDto dto = IngredientPriceDto.builder()
                        .ingredientName(ingredientName)
                        .productName(pm.getProductName())
                        .packagePrice(pm.getPrice())
                        .productUrl(pm.getProductUrl())
                        .thumbnailUrl("")
                        .lastSyncedAt(pm.getLastSyncedAt() != null ? pm.getLastSyncedAt().toString() : "")
                        .build();

                // Redis 캐시 갱신
                cacheInRedis(ingredientName, dto);
                return Optional.of(dto);
            }
        }

        return Optional.empty();
    }

    /**
     * 전체 등록된 식재료의 최신 컬리 가격 목록 반환
     */
    public Map<String, IngredientPriceDto> getAllKurlyPrices() {
        Map<String, IngredientPriceDto> result = new HashMap<>();

        for (String name : CORE_INGREDIENTS) {
            getIngredientPrice(name).ifPresent(dto -> result.put(name, dto));
        }

        return result;
    }

    /**
     * 특정 식재료 1건을 컬리 API에서 실시간 수집하여 DB 및 Redis에 저장
     */
    @Transactional
    public Optional<IngredientPriceDto> syncIngredient(String ingredientName) {
        log.info("마켓컬리 가격 동기화 시작: 식재료={}", ingredientName);

        Optional<KurlyApiClient.KurlyProductDto> productOpt = kurlyApiClient.getBestProduct(ingredientName);
        if (productOpt.isEmpty()) {
            log.warn("컬리에서 검색 결과를 찾지 못했습니다: {}", ingredientName);
            return Optional.empty();
        }

        KurlyApiClient.KurlyProductDto product = productOpt.get();

        // 1. 식재료 엔티티 확보 (없으면 신규 생성)
        Ingredient ingredient = ingredientRepository.findByName(ingredientName)
                .orElseGet(() -> ingredientRepository.save(Ingredient.builder()
                        .name(ingredientName)
                        .category("기타")
                        .storageType(Ingredient.StorageType.REFRIGERATED)
                        .build()));

        // 2. ProductMapping DB 저장 / 갱신
        ProductMapping mapping = productMappingRepository
                .findByIngredientIdAndPlatform(ingredient.getId(), PLATFORM_KURLY)
                .orElse(null);

        if (mapping != null) {
            mapping.updatePrice(product.getPrice());
        } else {
            mapping = ProductMapping.builder()
                    .ingredient(ingredient)
                    .platform(PLATFORM_KURLY)
                    .productId(product.getProductId())
                    .productName(product.getProductName())
                    .productUrl(product.getProductUrl())
                    .price(product.getPrice())
                    .build();
            productMappingRepository.save(mapping);
        }

        IngredientPriceDto dto = IngredientPriceDto.builder()
                .ingredientName(ingredientName)
                .productName(product.getProductName())
                .packagePrice(product.getPrice())
                .productUrl(product.getProductUrl())
                .thumbnailUrl(product.getThumbnailUrl())
                .lastSyncedAt(java.time.LocalDateTime.now().toString())
                .build();

        // 3. Redis 캐싱 (24시간)
        cacheInRedis(ingredientName, dto);

        return Optional.of(dto);
    }

    /**
     * 핵심 식재료 일괄 가격 동기화 (배치 작업용)
     */
    public int syncAllCoreIngredients() {
        log.info("=== 마켓컬리 일일 식재료 가격 자동 동기화 배치 시작 (총 {}종) ===", CORE_INGREDIENTS.size());
        int successCount = 0;

        for (String ingredient : CORE_INGREDIENTS) {
            try {
                Optional<IngredientPriceDto> res = syncIngredient(ingredient);
                if (res.isPresent()) {
                    successCount++;
                }
                // 과도한 요청 방지 (0.8초 딜레이)
                Thread.sleep(800);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            } catch (Exception e) {
                log.error("식재료 동기화 실패: ingredient={}, error={}", ingredient, e.getMessage());
            }
        }

        log.info("=== 마켓컬리 일일 가격 동기화 완료: 성공 {} / 총 {} ===", successCount, CORE_INGREDIENTS.size());
        return successCount;
    }

    private void cacheInRedis(String ingredientName, IngredientPriceDto dto) {
        try {
            String cacheKey = REDIS_KEY_PREFIX + ingredientName;
            Map<String, Object> map = new HashMap<>();
            map.put("ingredientName", dto.getIngredientName());
            map.put("productName", dto.getProductName());
            map.put("packagePrice", dto.getPackagePrice());
            map.put("productUrl", dto.getProductUrl());
            map.put("thumbnailUrl", dto.getThumbnailUrl());
            map.put("lastSyncedAt", dto.getLastSyncedAt());

            redisTemplate.opsForValue().set(cacheKey, map, CACHE_TTL);
        } catch (Exception e) {
            log.warn("Redis 가격 캐싱 실패: {}", e.getMessage());
        }
    }
}
