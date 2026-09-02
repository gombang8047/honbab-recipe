package com.honbab.diary.domain.cart.dto;

import com.honbab.diary.domain.cart.entity.Cart;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;
import java.util.stream.Collectors;

@Getter
@Builder
@AllArgsConstructor
public class CartResponse {

    private Long cartId;
    private String status;
    private List<CartItemResponse> items;
    private int totalAmount;
    private int totalItems;

    public static CartResponse from(Cart cart) {
        List<CartItemResponse> itemResponses = cart.getItems().stream()
                .map(CartItemResponse::from)
                .collect(Collectors.toList());

        return CartResponse.builder()
                .cartId(cart.getId())
                .status(cart.getStatus().name())
                .items(itemResponses)
                .totalAmount(cart.getTotalAmount())
                .totalItems(itemResponses.size())
                .build();
    }
}
