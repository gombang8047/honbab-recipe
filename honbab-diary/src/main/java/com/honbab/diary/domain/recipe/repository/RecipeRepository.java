package com.honbab.diary.domain.recipe.repository;

import com.honbab.diary.domain.recipe.entity.Recipe;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface RecipeRepository extends JpaRepository<Recipe, Long> {

    Optional<Recipe> findByShortsId(Long shortsId);

    boolean existsByShortsId(Long shortsId);

    @Query("SELECT r FROM Recipe r JOIN FETCH r.shorts WHERE " +
            "LOWER(r.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(r.description) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Page<Recipe> searchByKeyword(String keyword, Pageable pageable);

    @Query("SELECT r FROM Recipe r JOIN FETCH r.shorts ORDER BY r.createdAt DESC")
    Page<Recipe> findAllWithShorts(Pageable pageable);
}
