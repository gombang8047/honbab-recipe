package com.honbab.diary.domain.cart.dto;

import com.honbab.diary.domain.cart.entity.CartItem;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class CartItemResponse {

    private Long itemId;
    private String productName;
    private String platform;
    private String productUrl;
    private Integer quantity;
    private Integer price;
    private Integer subtotal;

    public static CartItemResponse from(CartItem item) {
        return CartItemResponse.builder()
                .itemId(item.getId())
                .productName(item.getProductMapping().getProductName())
                .platform(item.getProductMapping().getPlatform())
                .productUrl(item.getProductMapping().getProductUrl())
                .quantity(item.getQuantity())
                .price(item.getPrice())
                .subtotal(item.getSubtotal())
                .build();
    }
}
