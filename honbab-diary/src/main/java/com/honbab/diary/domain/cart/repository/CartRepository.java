package com.honbab.diary.domain.cart.repository;

import com.honbab.diary.domain.cart.entity.Cart;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CartRepository extends JpaRepository<Cart, Long> {

    Optional<Cart> findByUserIdAndStatus(Long userId, Cart.CartStatus status);

    Optional<Cart> findTopByUserIdOrderByCreatedAtDesc(Long userId);
}
