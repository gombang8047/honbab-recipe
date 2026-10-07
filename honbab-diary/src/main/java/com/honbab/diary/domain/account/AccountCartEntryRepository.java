package com.honbab.diary.domain.account;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface AccountCartEntryRepository extends JpaRepository<AccountCartEntry, Long> {
    List<AccountCartEntry> findByUserIdOrderByAddedAtAsc(Long userId);
}
