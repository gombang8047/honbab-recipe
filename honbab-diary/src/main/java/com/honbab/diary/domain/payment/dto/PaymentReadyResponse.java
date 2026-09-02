package com.honbab.diary.domain.payment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class PaymentReadyResponse {

    private String tid;
    private String redirectUrl;
    private Long paymentHistoryId;
}
