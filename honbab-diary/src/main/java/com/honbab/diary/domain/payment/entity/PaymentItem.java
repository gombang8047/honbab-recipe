package com.honbab.diary.domain.payment.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "payment_item")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PaymentItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_history_id", nullable = false)
    private PaymentHistory paymentHistory;

    @Column(name = "product_name", nullable = false)
    private String productName;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false)
    private Integer price;

    @Builder
    public PaymentItem(PaymentHistory paymentHistory, String productName,
                       Integer quantity, Integer price) {
        this.paymentHistory = paymentHistory;
        this.productName = productName;
        this.quantity = quantity;
        this.price = price;
    }
}
