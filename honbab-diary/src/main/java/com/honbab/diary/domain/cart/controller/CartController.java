package com.honbab.diary.domain.cart.controller;

import com.honbab.diary.domain.cart.dto.CartResponse;
import com.honbab.diary.domain.cart.service.CartService;
import com.honbab.diary.global.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@Tag(name = "장바구니", description = "레시피 재료 장바구니 관리 API")
@RestController
@RequestMapping("/api/v1/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @Operation(summary = "장바구니 조회", description = "현재 활성 장바구니를 조회합니다.")
    @GetMapping
    public ResponseEntity<ApiResponse<CartResponse>> getCart(Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        return ResponseEntity.ok(ApiResponse.ok(cartService.getActiveCart(userId)));
    }

    @Operation(summary = "레시피 재료 장바구니 담기", description = "레시피의 모든 재료를 장바구니에 추가합니다.")
    @PostMapping("/from-recipe/{recipeId}")
    public ResponseEntity<ApiResponse<CartResponse>> addFromRecipe(
            @PathVariable Long recipeId, Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        return ResponseEntity.ok(ApiResponse.ok(cartService.addFromRecipe(recipeId, userId)));
    }

    @Operation(summary = "수량 변경", description = "장바구니 아이템의 수량을 변경합니다.")
    @PatchMapping("/items/{itemId}")
    public ResponseEntity<ApiResponse<CartResponse>> updateQuantity(
            @PathVariable Long itemId,
            @RequestParam Integer quantity,
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        return ResponseEntity.ok(ApiResponse.ok(
                cartService.updateItemQuantity(itemId, quantity, userId)));
    }

    @Operation(summary = "아이템 제거", description = "장바구니에서 아이템을 제거합니다.")
    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<ApiResponse<CartResponse>> removeItem(
            @PathVariable Long itemId, Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        return ResponseEntity.ok(ApiResponse.ok(cartService.removeItem(itemId, userId)));
    }
}
