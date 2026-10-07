package com.honbab.diary.domain.account;

import jakarta.persistence.*;
import lombok.*;
import static com.honbab.diary.domain.account.AccountContentDtos.*;

@Entity
@Table(name="account_cart_entry", uniqueConstraints=@UniqueConstraint(columnNames={"user_id", "client_id"}))
@Getter
@NoArgsConstructor(access=AccessLevel.PROTECTED)
public class AccountCartEntry {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="user_id", nullable=false) private Long userId;
    @Column(name="client_id", nullable=false, length=250) private String clientId;
    @Column(nullable=false) private Long recipeId;
    @Column(nullable=false, length=300) private String recipeTitle;
    @Column(nullable=false, length=150) private String name;
    @Column(nullable=false, length=100) private String amount;
    @Column(nullable=false, length=50) private String unit;
    @Column(nullable=false) private boolean essential;
    @Column(nullable=false) private boolean checked;
    @Column(nullable=false) private int quantity;
    @Column(nullable=false) private int estimatedPrice;
    @Column(nullable=false) private long addedAt;

    public AccountCartEntry(Long userId, CartInput input) {
        this.userId=userId; this.clientId=input.id(); this.recipeId=input.recipeId();
        this.recipeTitle=input.recipeTitle(); this.name=input.name(); this.amount=input.amount();
        this.unit=input.unit(); this.essential=input.isEssential(); this.checked=input.checked();
        this.quantity=input.quantity(); this.estimatedPrice=input.estimatedPrice();
        this.addedAt=Math.min(input.addedAt(), System.currentTimeMillis());
    }
    public void add(int amount, boolean checked) {
        quantity=Math.min(999, quantity+amount);
        this.checked=checked;
    }
    public void patch(Boolean checked, Integer quantity) {
        if (checked!=null) this.checked=checked;
        if (quantity!=null) this.quantity=quantity;
    }
    public CartView view() {
        return new CartView(clientId, recipeId, recipeTitle, name, amount, unit, essential,
                checked, quantity, estimatedPrice, addedAt);
    }
}
