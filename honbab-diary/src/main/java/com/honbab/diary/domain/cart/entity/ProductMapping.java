package com.honbab.diary.domain.cart.entity;

import com.honbab.diary.domain.recipe.entity.Ingredient;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "product_mapping")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ProductMapping {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ingredient_id", nullable = false)
    private Ingredient ingredient;

    @Column(nullable = false, length = 30)
    private String platform;

    @Column(name = "product_id", nullable = false)
    private String productId;

    @Column(name = "product_name", nullable = false)
    private String productName;

    @Column(name = "product_url")
    private String productUrl;

    @Column(nullable = false)
    private Integer price;

    @Column(name = "last_synced_at")
    private LocalDateTime lastSyncedAt;

    @Builder
    public ProductMapping(Ingredient ingredient, String platform, String productId,
                          String productName, String productUrl, Integer price) {
        this.ingredient = ingredient;
        this.platform = platform;
        this.productId = productId;
        this.productName = productName;
        this.productUrl = productUrl;
        this.price = price;
        this.lastSyncedAt = LocalDateTime.now();
    }

    public void updatePrice(Integer price) {
        this.price = price;
        this.lastSyncedAt = LocalDateTime.now();
    }
}
