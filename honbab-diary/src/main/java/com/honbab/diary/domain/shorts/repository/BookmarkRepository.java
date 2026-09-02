package com.honbab.diary.domain.shorts.repository;

import com.honbab.diary.domain.shorts.entity.UserRecipeBookmark;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BookmarkRepository extends JpaRepository<UserRecipeBookmark, Long> {

    Optional<UserRecipeBookmark> findByUserIdAndShortsId(Long userId, Long shortsId);

    boolean existsByUserIdAndShortsId(Long userId, Long shortsId);

    Page<UserRecipeBookmark> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    void deleteByUserIdAndShortsId(Long userId, Long shortsId);
}
