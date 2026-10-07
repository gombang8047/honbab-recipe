package com.honbab.diary.domain.account;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
public interface CookingDiaryRepository extends JpaRepository<CookingDiary, Long> {
    List<CookingDiary> findByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<CookingDiary> findByUserIdAndClientId(Long userId, String clientId);
}
