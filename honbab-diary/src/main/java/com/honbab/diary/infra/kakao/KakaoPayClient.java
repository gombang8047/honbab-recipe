package com.honbab.diary.infra.kakao;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Map;

@Slf4j
@Component
public class KakaoPayClient {

    public Map<String, Object> ready(String orderId, String userId, String itemName, int quantity, int totalAmount) {
        log.info("[MOCK] KakaoPay ready: orderId={}, amount={}", orderId, totalAmount);
        return Map.of(
                "tid", "T1234567890123456789",
                "next_redirect_pc_url", "https://mock.kakaopay.com/online/v1/ping/pc/index.html"
        );
    }

    public Map<String, Object> approve(String tid, String pgToken, String userId) {
        log.info("[MOCK] KakaoPay approve: tid={}, pgToken={}", tid, pgToken);
        return Map.of(
                "aid", "A1234567890123456789",
                "tid", tid,
                "cid", "TC0ONETIME"
        );
    }

    public void cancel(String tid, int cancelAmount) {
        log.info("[MOCK] KakaoPay cancel: tid={}, amount={}", tid, cancelAmount);
    }
}
