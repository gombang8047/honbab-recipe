package com.honbab.diary.domain.shorts.repository;

import com.honbab.diary.domain.shorts.entity.Shorts;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface ShortsRepository extends JpaRepository<Shorts, Long> {

    Optional<Shorts> findByYoutubeId(String youtubeId);

    boolean existsByYoutubeId(String youtubeId);

    @Query("SELECT s FROM Shorts s WHERE s.status = 'ACTIVE' ORDER BY s.createdAt DESC")
    Page<Shorts> findActiveShortsOrderByCreatedAtDesc(Pageable pageable);

    @Query("SELECT s FROM Shorts s WHERE s.status = 'ACTIVE' ORDER BY s.viewCount DESC")
    Page<Shorts> findTrendingShorts(Pageable pageable);

    @Query("SELECT DISTINCT s FROM Shorts s " +
            "LEFT JOIN s.tags t " +
            "WHERE s.status = 'ACTIVE' AND (" +
            "LOWER(s.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(s.channelName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(t.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "EXISTS (SELECT 1 FROM Recipe r JOIN r.ingredients ri JOIN ri.ingredient i " +
            "        WHERE r.shorts = s AND LOWER(i.name) LIKE LOWER(CONCAT('%', :keyword, '%'))))")
    Page<Shorts> searchShorts(String keyword, Pageable pageable);

    @Query("SELECT s FROM Shorts s WHERE s.status = 'ACTIVE' AND " +
            "(LOWER(s.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(s.channelName) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Shorts> searchByKeyword(String keyword, Pageable pageable);
}
