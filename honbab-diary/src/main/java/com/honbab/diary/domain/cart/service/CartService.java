package com.honbab.diary.domain.cart.service;

import com.honbab.diary.domain.cart.dto.CartResponse;
import com.honbab.diary.domain.cart.entity.Cart;
import com.honbab.diary.domain.cart.entity.CartItem;
import com.honbab.diary.domain.cart.entity.ProductMapping;
import com.honbab.diary.domain.cart.repository.CartRepository;
import com.honbab.diary.domain.cart.repository.ProductMappingRepository;
import com.honbab.diary.domain.recipe.entity.Recipe;
import com.honbab.diary.domain.recipe.entity.RecipeIngredient;
import com.honbab.diary.domain.recipe.repository.RecipeRepository;
import com.honbab.diary.domain.user.entity.User;
import com.honbab.diary.domain.user.service.UserService;
import com.honbab.diary.global.exception.BusinessException;
import com.honbab.diary.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CartService {

    private final CartRepository cartRepository;
    private final ProductMappingRepository productMappingRepository;
    private final RecipeRepository recipeRepository;
    private final UserService userService;

    /**
     * 현재 활성 장바구니 조회
     */
    public CartResponse getActiveCart(Long userId) {
        Cart cart = getOrCreateActiveCart(userId);
        return CartResponse.from(cart);
    }

    /**
     * 레시피 재료를 장바구니에 추가
     */
    @Transactional
    public CartResponse addFromRecipe(Long recipeId, Long userId) {
        Recipe recipe = recipeRepository.findById(recipeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RECIPE_NOT_FOUND));

        Cart cart = getOrCreateActiveCart(userId);

        for (RecipeIngredient ri : recipe.getIngredients()) {
            List<ProductMapping> mappings = productMappingRepository
                    .findByIngredientId(ri.getIngredient().getId());

            if (!mappings.isEmpty()) {
                ProductMapping mapping = mappings.get(0); // 가장 첫 번째 매핑 사용
                CartItem item = CartItem.builder()
                        .cart(cart)
                        .productMapping(mapping)
                        .quantity(1)
                        .price(mapping.getPrice())
                        .build();
                cart.addItem(item);
            }
        }

        log.info("레시피 재료 장바구니 추가: recipeId={}, userId={}, items={}", 
                recipeId, userId, cart.getItems().size());
        return CartResponse.from(cart);
    }

    /**
     * 장바구니 아이템 수량 변경
     */
    @Transactional
    public CartResponse updateItemQuantity(Long itemId, Integer quantity, Long userId) {
        Cart cart = getActiveCartByUserId(userId);
        CartItem item = cart.getItems().stream()
                .filter(i -> i.getId().equals(itemId))
                .findFirst()
                .orElseThrow(() -> new BusinessException(ErrorCode.CART_ITEM_NOT_FOUND));

        item.updateQuantity(quantity);
        return CartResponse.from(cart);
    }

    /**
     * 장바구니 아이템 제거
     */
    @Transactional
    public CartResponse removeItem(Long itemId, Long userId) {
        Cart cart = getActiveCartByUserId(userId);
        CartItem item = cart.getItems().stream()
                .filter(i -> i.getId().equals(itemId))
                .findFirst()
                .orElseThrow(() -> new BusinessException(ErrorCode.CART_ITEM_NOT_FOUND));

        cart.removeItem(item);
        return CartResponse.from(cart);
    }

    private Cart getOrCreateActiveCart(Long userId) {
        return cartRepository.findByUserIdAndStatus(userId, Cart.CartStatus.ACTIVE)
                .orElseGet(() -> {
                    User user = userService.findById(userId);
                    return cartRepository.save(new Cart(user));
                });
    }

    private Cart getActiveCartByUserId(Long userId) {
        return cartRepository.findByUserIdAndStatus(userId, Cart.CartStatus.ACTIVE)
                .orElseThrow(() -> new BusinessException(ErrorCode.CART_NOT_FOUND));
    }
}
