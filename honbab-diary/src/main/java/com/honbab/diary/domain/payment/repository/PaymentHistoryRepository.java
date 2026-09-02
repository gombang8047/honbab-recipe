package com.honbab.diary.domain.payment.repository;

import com.honbab.diary.domain.payment.entity.PaymentHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PaymentHistoryRepository extends JpaRepository<PaymentHistory, Long> {

    Page<PaymentHistory> findByUserIdOrderByPaidAtDesc(Long userId, Pageable pageable);

    Optional<PaymentHistory> findByKakaoTid(String kakaoTid);

    Optional<PaymentHistory> findByTransactionId(String transactionId);
}
