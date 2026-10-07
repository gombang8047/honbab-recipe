package com.honbab.diary.domain.account;

import jakarta.validation.constraints.*;
import java.util.List;

public final class AccountContentDtos {
    private AccountContentDtos() {}

    public record CartInput(
            @NotBlank @Size(max=250) String id,
            @NotNull @PositiveOrZero Long recipeId,
            @NotBlank @Size(max=300) String recipeTitle,
            @NotBlank @Size(max=150) String name,
            @NotNull @Size(max=100) String amount,
            @NotNull @Size(max=50) String unit,
            boolean isEssential, boolean checked,
            @Min(1) @Max(999) int quantity,
            @Min(0) @Max(10000000) int estimatedPrice,
            @Positive long addedAt) {}

    public record CartView(String id, Long recipeId, String recipeTitle, String name,
            String amount, String unit, boolean isEssential, boolean checked,
            int quantity, int estimatedPrice, long addedAt) {}

    public record CartPatch(Boolean checked, @Min(1) @Max(999) Integer quantity) {}
    public record CartUpdate(@NotBlank @Size(max=250) String id,
            Boolean checked, @Min(1) @Max(999) Integer quantity) {}
    public record CartCheck(@NotNull @Size(max=1000) List<@NotBlank @Size(max=250) String> ids, boolean checked) {}
    public record CartRemove(@NotNull @Size(max=1000) List<@NotBlank @Size(max=250) String> ids) {}

    public record DiaryInput(
            @NotBlank @Size(max=150) String id,
            @NotNull @PositiveOrZero Long recipeId,
            @Positive Long shortsId,
            @NotBlank @Size(max=300) String recipeTitle,
            @NotBlank @Size(max=3000000) String photoUrl,
            @Min(1) @Max(5) int rating,
            @NotBlank @Size(max=1000) String comment,
            @Size(max=10000) String privateDiary,
            @Positive long createdAt) {}

    public record DiaryView(String id, Long recipeId, Long shortsId, String recipeTitle,
            String photoUrl, int rating, String comment, String privateDiary,
            String userNickname, String authorName, int userLevel, String userLevelTitle,
            long createdAt, int likes, boolean likedByMe, boolean isLiked,
            boolean isMyEntry, int streakDay) {}

    public record DiarySnapshot(List<DiaryView> entries, int totalXp, String lastLoginDate,
            int loginStreak, int todayEarnedXp) {}
    public record DiaryCreated(DiarySnapshot snapshot, String entryId, int earnedXp,
            int rawEarnedXp, int streakBonus) {}
    public record LoginAward(DiarySnapshot snapshot, boolean awarded, int earnedXp) {}
    public record DiaryLike(boolean liked) {}
    public record DiarySync(@Positive long shortsId, @Positive long recipeId) {}
}
