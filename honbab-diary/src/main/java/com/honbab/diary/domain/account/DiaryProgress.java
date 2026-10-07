package com.honbab.diary.domain.account;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity @Table(name="diary_progress") @Getter
@NoArgsConstructor(access=AccessLevel.PROTECTED)
public class DiaryProgress {
    @Id private Long userId;
    @Column(nullable=false) private int totalXp;
    private LocalDate lastLoginDate;
    @Column(nullable=false) private int loginStreak;
    private LocalDate diaryXpDate;
    @Column(nullable=false) private int diaryXp;
    public DiaryProgress(Long userId) { this.userId=userId; }
    public int todayXp(LocalDate today) { return today.equals(diaryXpDate) ? diaryXp : 0; }
    public int awardDiary(LocalDate today, int raw) {
        int current=todayXp(today);
        int earned=Math.min(raw, Math.max(0, 400-current));
        diaryXpDate=today; diaryXp=current+earned; totalXp+=earned;
        return earned;
    }
    public int awardLogin(LocalDate today) {
        if (today.equals(lastLoginDate)) return 0;
        loginStreak=today.minusDays(1).equals(lastLoginDate) ? loginStreak+1 : 1;
        lastLoginDate=today;
        int earned=15+(loginStreak>=7 ? 10 : loginStreak>=3 ? 5 : 0);
        totalXp+=earned;
        return earned;
    }
}
