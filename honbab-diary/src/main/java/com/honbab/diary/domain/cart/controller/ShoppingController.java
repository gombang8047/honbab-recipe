package com.honbab.diary.domain.cart.controller;

import com.honbab.diary.domain.cart.service.ShoppingPriceService;
import com.honbab.diary.global.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/shopping/kurly")
@RequiredArgsConstructor
@Tag(name = "Shopping Price", description = "마켓컬리 실시간 및 일일 동기화 식재료 가격 API")
public class ShoppingController {

    private final ShoppingPriceService shoppingPriceService;

    @Operation(summary = "마켓컬리 주요 식재료 최신 가격 목록 조회 (Redis 캐시 기반)")
    @GetMapping("/prices")
    public ResponseEntity<ApiResponse<Map<String, ShoppingPriceService.IngredientPriceDto>>> getAllKurlyPrices() {
        Map<String, ShoppingPriceService.IngredientPriceDto> prices = shoppingPriceService.getAllKurlyPrices();
        return ResponseEntity.ok(ApiResponse.ok(prices));
    }

    @Operation(summary = "특정 식재료 마켓컬리 최신 가격 조회")
    @GetMapping("/prices/{ingredient}")
    public ResponseEntity<ApiResponse<ShoppingPriceService.IngredientPriceDto>> getIngredientPrice(
            @PathVariable String ingredient) {
        return shoppingPriceService.getIngredientPrice(ingredient)
                .map(dto -> ResponseEntity.ok(ApiResponse.ok(dto)))
                .orElseGet(() -> ResponseEntity.ok(ApiResponse.ok(null)));
    }

    @Operation(summary = "마켓컬리 전체 핵심 식재료 가격 수동 즉시 동기화 (관리자/테스트용)")
    @PostMapping("/sync")
    public ResponseEntity<ApiResponse<Map<String, Object>>> syncAll() {
        int count = shoppingPriceService.syncAllCoreIngredients();
        return ResponseEntity.ok(ApiResponse.ok(Map.of(
                "message", "동기화가 완료되었습니다.",
                "syncedCount", count
        )));
    }

    @Operation(summary = "특정 식재료 1건 마켓컬리 실시간 즉시 동기화")
    @PostMapping("/sync/{ingredient}")
    public ResponseEntity<ApiResponse<ShoppingPriceService.IngredientPriceDto>> syncSingle(
            @PathVariable String ingredient) {
        return shoppingPriceService.syncIngredient(ingredient)
                .map(dto -> ResponseEntity.ok(ApiResponse.ok(dto)))
                .orElseGet(() -> ResponseEntity.ok(ApiResponse.ok(null)));
    }
}
