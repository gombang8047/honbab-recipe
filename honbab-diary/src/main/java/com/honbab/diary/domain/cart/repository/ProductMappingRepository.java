package com.honbab.diary.domain.cart.repository;

import com.honbab.diary.domain.cart.entity.ProductMapping;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProductMappingRepository extends JpaRepository<ProductMapping, Long> {

    List<ProductMapping> findByIngredientId(Long ingredientId);

    Optional<ProductMapping> findByIngredientIdAndPlatform(Long ingredientId, String platform);
}
