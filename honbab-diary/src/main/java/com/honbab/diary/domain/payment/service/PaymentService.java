package com.honbab.diary.domain.payment.service;

import com.honbab.diary.domain.cart.entity.Cart;
import com.honbab.diary.domain.cart.entity.CartItem;
import com.honbab.diary.domain.cart.repository.CartRepository;
import com.honbab.diary.domain.payment.dto.PaymentApproveRequest;
import com.honbab.diary.domain.payment.dto.PaymentReadyRequest;
import com.honbab.diary.domain.payment.dto.PaymentReadyResponse;
import com.honbab.diary.domain.payment.entity.PaymentHistory;
import com.honbab.diary.domain.payment.entity.PaymentItem;
import com.honbab.diary.domain.payment.repository.PaymentHistoryRepository;
import com.honbab.diary.domain.user.entity.User;
import com.honbab.diary.domain.user.service.UserService;
import com.honbab.diary.global.exception.BusinessException;
import com.honbab.diary.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentHistoryRepository paymentHistoryRepository;
    private final CartRepository cartRepository;
    private final UserService userService;
    private final KakaoPayService kakaoPayService;

    /**
     * 결제 준비 (카카오페이 Ready)
     */
    @Transactional
    public PaymentReadyResponse readyPayment(PaymentReadyRequest request, Long userId) {
        Cart cart = cartRepository.findById(request.getCartId())
                .orElseThrow(() -> new BusinessException(ErrorCode.CART_NOT_FOUND));

        User user = userService.findById(userId);

        // 카카오페이 결제 준비
        var kakaoResponse = kakaoPayService.ready(
                user.getId(), cart.getId(), cart.getTotalAmount(), buildItemName(cart));

        // 결제 내역 생성 (PENDING 상태)
        PaymentHistory payment = PaymentHistory.builder()
                .user(user)
                .paymentMethod("KAKAOPAY")
                .totalAmount(cart.getTotalAmount())
                .kakaoTid(kakaoResponse.getTid())
                .build();

        // 결제 아이템 추가
        for (CartItem item : cart.getItems()) {
            payment.addItem(PaymentItem.builder()
                    .paymentHistory(payment)
                    .productName(item.getProductMapping().getProductName())
                    .quantity(item.getQuantity())
                    .price(item.getPrice())
                    .build());
        }

        paymentHistoryRepository.save(payment);

        log.info("결제 준비 완료: paymentId={}, tid={}, amount={}",
                payment.getId(), kakaoResponse.getTid(), cart.getTotalAmount());

        return PaymentReadyResponse.builder()
                .tid(kakaoResponse.getTid())
                .redirectUrl(kakaoResponse.getRedirectUrl())
                .paymentHistoryId(payment.getId())
                .build();
    }

    /**
     * 결제 승인 (카카오페이 Approve)
     */
    @Transactional
    public void approvePayment(PaymentApproveRequest request, Long userId) {
        PaymentHistory payment = paymentHistoryRepository.findByKakaoTid(request.getTid())
                .orElseThrow(() -> new BusinessException(ErrorCode.PAYMENT_NOT_FOUND));

        if (payment.getStatus() != PaymentHistory.PaymentStatus.PENDING) {
            throw new BusinessException(ErrorCode.PAYMENT_ALREADY_COMPLETED);
        }

        // 카카오페이 승인
        var approveResponse = kakaoPayService.approve(
                request.getTid(), request.getPgToken(), userId);

        payment.complete(approveResponse.getTransactionId());
        log.info("결제 승인 완료: paymentId={}, transactionId={}",
                payment.getId(), approveResponse.getTransactionId());
    }

    /**
     * 결제 취소
     */
    @Transactional
    public void cancelPayment(Long paymentId, Long userId) {
        PaymentHistory payment = paymentHistoryRepository.findById(paymentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PAYMENT_NOT_FOUND));

        kakaoPayService.cancel(payment.getKakaoTid(), payment.getTotalAmount());
        payment.cancel();

        log.info("결제 취소 완료: paymentId={}", paymentId);
    }

    /**
     * 결제 내역 조회
     */
    @Transactional(readOnly = true)
    public Page<PaymentHistory> getPaymentHistory(Long userId, Pageable pageable) {
        return paymentHistoryRepository.findByUserIdOrderByPaidAtDesc(userId, pageable);
    }

    private String buildItemName(Cart cart) {
        if (cart.getItems().isEmpty()) return "혼밥일기 장바구니";
        String firstName = cart.getItems().get(0).getProductMapping().getProductName();
        int remaining = cart.getItems().size() - 1;
        return remaining > 0 ? firstName + " 외 " + remaining + "건" : firstName;
    }
}
