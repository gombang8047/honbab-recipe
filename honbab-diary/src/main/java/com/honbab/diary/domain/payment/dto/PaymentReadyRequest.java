package com.honbab.diary.domain.payment.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class PaymentReadyRequest {

    @NotNull(message = "장바구니 ID는 필수입니다.")
    private Long cartId;
}
