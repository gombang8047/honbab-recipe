package com.honbab.diary.domain.payment.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class PaymentApproveRequest {

    @NotBlank(message = "pg_token은 필수입니다.")
    private String pgToken;

    @NotBlank(message = "tid는 필수입니다.")
    private String tid;
}
