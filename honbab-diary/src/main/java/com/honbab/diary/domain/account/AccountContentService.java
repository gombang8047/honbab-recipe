package com.honbab.diary.domain.account;

import com.honbab.diary.domain.user.entity.User;
import com.honbab.diary.domain.user.repository.UserRepository;
import com.honbab.diary.domain.recipe.repository.RecipeRepository;
import com.honbab.diary.global.exception.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.util.*;
import static com.honbab.diary.domain.account.AccountContentDtos.*;

@Service @RequiredArgsConstructor @Transactional(readOnly=true)
public class AccountContentService {
    private static final ZoneId ZONE=ZoneId.of("Asia/Seoul");
    private final AccountCartEntryRepository carts;
    private final CookingDiaryRepository diaries;
    private final DiaryProgressRepository progress;
    private final UserRepository users;
    private final RecipeRepository recipes;

    private User lock(Long userId) {
        return users.findLockedById(userId).orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
    }
    private User user(Long userId) {
        return users.findById(userId).orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
    }
    private LocalDate today() { return LocalDate.now(ZONE); }
    private DiaryProgress state(Long userId) {
        return progress.findById(userId).orElseGet(() -> progress.save(new DiaryProgress(userId)));
    }

    public List<CartView> cart(Long userId) {
        return carts.findByUserIdOrderByAddedAtAsc(userId).stream().map(AccountCartEntry::view).toList();
    }
    @Transactional
    public List<CartView> addCart(Long userId, List<CartInput> inputs, boolean imported) {
        lock(userId);
        List<AccountCartEntry> existing=carts.findByUserIdOrderByAddedAtAsc(userId);
        for (CartInput input : inputs) {
            AccountCartEntry item=existing.stream().filter(entry -> entry.getClientId().equals(input.id()) ||
                    (entry.getRecipeId().equals(input.recipeId()) && entry.getName().equals(input.name())))
                    .findFirst().orElse(null);
            if (item==null) {
                item=carts.save(new AccountCartEntry(userId, input));
                existing.add(item);
            } else if (!imported) item.add(input.quantity(), input.checked());
        }
        return existing.stream().map(AccountCartEntry::view).toList();
    }
    @Transactional
    public List<CartView> patchCart(Long userId, String id, CartPatch patch) {
        lock(userId);
        List<AccountCartEntry> entries=carts.findByUserIdOrderByAddedAtAsc(userId);
        entries.stream().filter(entry -> entry.getClientId().equals(id)).findFirst()
                .orElseThrow(() -> new BusinessException(ErrorCode.CART_ITEM_NOT_FOUND))
                .patch(patch.checked(), patch.quantity());
        return entries.stream().map(AccountCartEntry::view).toList();
    }
    @Transactional
    public List<CartView> checkCart(Long userId, CartCheck input) {
        lock(userId);
        Set<String> ids=new HashSet<>(input.ids());
        List<AccountCartEntry> entries=carts.findByUserIdOrderByAddedAtAsc(userId);
        entries.stream().filter(entry -> ids.contains(entry.getClientId())).forEach(entry -> entry.patch(input.checked(), null));
        return entries.stream().map(AccountCartEntry::view).toList();
    }
    @Transactional
    public List<CartView> removeCart(Long userId, List<String> ids) {
        lock(userId);
        List<AccountCartEntry> entries=carts.findByUserIdOrderByAddedAtAsc(userId);
        Set<String> selected=ids==null ? null : new HashSet<>(ids);
        List<AccountCartEntry> removed=entries.stream().filter(entry -> selected==null || selected.contains(entry.getClientId())).toList();
        carts.deleteAll(removed);
        return entries.stream().filter(entry -> !removed.contains(entry)).map(AccountCartEntry::view).toList();
    }

    public DiarySnapshot snapshot(Long userId) { return snapshot(user(userId)); }
    private DiarySnapshot snapshot(User user) {
        DiaryProgress p=progress.findById(user.getId()).orElseGet(() -> new DiaryProgress(user.getId()));
        return new DiarySnapshot(diaries.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .filter(entry -> !entry.isDeleted()).map(entry -> entry.view(user.getNickname())).toList(),
                p.getTotalXp(), p.getLastLoginDate()==null ? null : p.getLastLoginDate().toString(),
                p.getLoginStreak(), p.todayXp(today()));
    }
    private void validatePhoto(String photo) {
        if (!(photo.startsWith("https://") || photo.matches("(?s)^data:image/(jpeg|png|webp|gif);base64,[A-Za-z0-9+/=\\r\\n]+$"))) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }
    }
    private int streak(Long userId) {
        Set<LocalDate> dates=new HashSet<>();
        diaries.findByUserIdOrderByCreatedAtDesc(userId).stream().filter(entry -> !entry.isDeleted())
                .forEach(entry -> dates.add(Instant.ofEpochMilli(entry.getCreatedAt()).atZone(ZONE).toLocalDate()));
        LocalDate day=dates.contains(today()) ? today() : today().minusDays(1);
        int count=0;
        while (dates.contains(day)) { count++; day=day.minusDays(1); }
        return count;
    }
    @Transactional
    public DiaryCreated createDiary(Long userId, DiaryInput input) {
        User user=lock(userId);
        validatePhoto(input.photoUrl());
        Optional<CookingDiary> previous=diaries.findByUserIdAndClientId(userId, input.id());
        if (previous.isPresent()) {
            if (previous.get().isDeleted()) throw new BusinessException(ErrorCode.INVALID_INPUT);
            return new DiaryCreated(snapshot(user), input.id(), 0, 0, 0);
        }
        int streak=streak(userId);
        int bonus=streak>=7 ? 200 : streak>=3 ? 60 : streak>=2 ? 30 : 0;
        int earned=state(userId).awardDiary(today(), 100+bonus);
        diaries.save(new CookingDiary(userId, input, false, Math.max(1, streak)));
        return new DiaryCreated(snapshot(user), input.id(), earned, 100+bonus, bonus);
    }
    @Transactional
    public DiarySnapshot importDiaries(Long userId, List<DiaryInput> inputs) {
        User user=lock(userId);
        long bytes=inputs.stream().mapToLong(input -> input.photoUrl().length()).sum();
        if (bytes>6000000) throw new BusinessException(ErrorCode.INVALID_INPUT);
        for (DiaryInput input : inputs) {
            validatePhoto(input.photoUrl());
            if (diaries.findByUserIdAndClientId(userId, input.id()).isEmpty()) {
                // Historical imports do not award new-entry XP or trust client XP values.
                diaries.save(new CookingDiary(userId, input, true, 1));
            }
        }
        return snapshot(user);
    }
    @Transactional
    public DiarySnapshot likeDiary(Long userId, String id, boolean liked) {
        User user=lock(userId);
        CookingDiary diary=diaries.findByUserIdAndClientId(userId, id)
                .filter(entry -> !entry.isDeleted()).orElseThrow(() -> new BusinessException(ErrorCode.INVALID_INPUT));
        diary.like(liked);
        return snapshot(user);
    }
    @Transactional
    public DiarySnapshot deleteDiary(Long userId, String id) {
        User user=lock(userId);
        diaries.findByUserIdAndClientId(userId, id).ifPresent(CookingDiary::delete);
        return snapshot(user);
    }
    @Transactional
    public DiarySnapshot syncDiary(Long userId, DiarySync input) {
        User user=lock(userId);
        if (recipes.findById(input.recipeId()).filter(recipe -> recipe.getShorts().getId().equals(input.shortsId())).isEmpty()) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }
        diaries.findByUserIdOrderByCreatedAtDesc(userId).stream().filter(entry -> !entry.isDeleted())
                .forEach(entry -> entry.syncRecipe(input.shortsId(), input.recipeId()));
        return snapshot(user);
    }
    @Transactional
    public LoginAward loginXp(Long userId) {
        User user=lock(userId);
        int earned=state(userId).awardLogin(today());
        return new LoginAward(snapshot(user), earned>0, earned);
    }
}
