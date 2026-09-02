package com.honbab.diary.domain.payment.entity;

import com.honbab.diary.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "payment_history")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PaymentHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "payment_method", nullable = false, length = 30)
    private String paymentMethod;

    @Column(name = "transaction_id", unique = true)
    private String transactionId;

    @Column(name = "total_amount", nullable = false)
    private Integer totalAmount;

    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private PaymentStatus status;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @Column(name = "kakao_tid")
    private String kakaoTid;

    @OneToMany(mappedBy = "paymentHistory", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PaymentItem> items = new ArrayList<>();

    @Builder
    public PaymentHistory(User user, String paymentMethod, String transactionId,
                          Integer totalAmount, String kakaoTid) {
        this.user = user;
        this.paymentMethod = paymentMethod;
        this.transactionId = transactionId;
        this.totalAmount = totalAmount;
        this.status = PaymentStatus.PENDING;
        this.kakaoTid = kakaoTid;
    }

    public void complete(String transactionId) {
        this.status = PaymentStatus.COMPLETED;
        this.transactionId = transactionId;
        this.paidAt = LocalDateTime.now();
    }

    public void cancel() {
        this.status = PaymentStatus.CANCELLED;
    }

    public void fail() {
        this.status = PaymentStatus.FAILED;
    }

    public void addItem(PaymentItem item) {
        this.items.add(item);
    }

    public enum PaymentStatus {
        PENDING, COMPLETED, CANCELLED, FAILED
    }
}
