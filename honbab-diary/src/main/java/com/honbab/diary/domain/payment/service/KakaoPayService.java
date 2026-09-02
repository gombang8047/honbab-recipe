package com.honbab.diary.domain.payment.service;

import com.honbab.diary.global.exception.BusinessException;
import com.honbab.diary.global.exception.ErrorCode;
import com.honbab.diary.infra.kakao.KakaoPayClient;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class KakaoPayService {

    private final KakaoPayClient kakaoPayClient;

    /**
     * 카카오페이 결제 준비
     */
    public ReadyResult ready(Long userId, Long orderId, int totalAmount, String itemName) {
        try {
            var response = kakaoPayClient.ready(
                    String.valueOf(orderId),
                    String.valueOf(userId),
                    itemName,
                    1,
                    totalAmount);

            return new ReadyResult(
                    (String) response.get("tid"),
                    (String) response.get("next_redirect_pc_url"));
        } catch (Exception e) {
            log.error("카카오페이 결제 준비 실패: {}", e.getMessage());
            throw new BusinessException(ErrorCode.PAYMENT_FAILED, "카카오페이 결제 준비에 실패했습니다.");
        }
    }

    /**
     * 카카오페이 결제 승인
     */
    public ApproveResult approve(String tid, String pgToken, Long userId) {
        try {
            var response = kakaoPayClient.approve(tid, pgToken, String.valueOf(userId));
            return new ApproveResult((String) response.get("aid"));
        } catch (Exception e) {
            log.error("카카오페이 결제 승인 실패: {}", e.getMessage());
            throw new BusinessException(ErrorCode.PAYMENT_FAILED, "카카오페이 결제 승인에 실패했습니다.");
        }
    }

    /**
     * 카카오페이 결제 취소
     */
    public void cancel(String tid, int cancelAmount) {
        try {
            kakaoPayClient.cancel(tid, cancelAmount);
        } catch (Exception e) {
            log.error("카카오페이 결제 취소 실패: {}", e.getMessage());
            throw new BusinessException(ErrorCode.PAYMENT_CANCEL_FAILED);
        }
    }

    @Getter
    @RequiredArgsConstructor
    public static class ReadyResult {
        private final String tid;
        private final String redirectUrl;
    }

    @Getter
    @RequiredArgsConstructor
    public static class ApproveResult {
        private final String transactionId;
    }
}
