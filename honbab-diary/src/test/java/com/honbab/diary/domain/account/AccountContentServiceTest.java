package com.honbab.diary.domain.account;

import com.honbab.diary.domain.user.entity.User;
import com.honbab.diary.domain.user.repository.UserRepository;
import com.honbab.diary.domain.recipe.repository.RecipeRepository;
import com.honbab.diary.global.exception.BusinessException;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import java.time.LocalDate;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static com.honbab.diary.domain.account.AccountContentDtos.*;

@ExtendWith(MockitoExtension.class)
class AccountContentServiceTest {
    @Mock AccountCartEntryRepository carts;
    @Mock CookingDiaryRepository diaries;
    @Mock DiaryProgressRepository progress;
    @Mock UserRepository users;
    @Mock RecipeRepository recipes;
    @InjectMocks AccountContentService service;

    @Test void cartImportRetriesAreIdempotentAndSeparateAccounts() {
        List<AccountCartEntry> records=new ArrayList<>();
        when(users.findLockedById(anyLong())).thenReturn(Optional.of(mock(User.class)));
        when(carts.findByUserIdOrderByAddedAtAsc(anyLong())).thenAnswer(call ->
                new ArrayList<>(records.stream().filter(entry -> entry.getUserId().equals(call.getArgument(0))).toList()));
        when(carts.save(any())).thenAnswer(call -> { AccountCartEntry item=call.getArgument(0); records.add(item); return item; });
        CartInput input=new CartInput("recipe_egg", 1L, "recipe", "egg", "1", "", true, true, 1, 100, 1000L);
        service.addCart(1L, List.of(input), true);
        service.addCart(1L, List.of(input), true);
        assertEquals(1, service.cart(1L).size());
        assertEquals(1, service.cart(1L).get(0).quantity());
        assertTrue(service.cart(2L).isEmpty());
        service.addCart(1L, List.of(input), false);
        assertEquals(2, service.cart(1L).get(0).quantity());
        assertThrows(BusinessException.class, () -> service.patchCart(2L, input.id(), new CartPatch(false, 9)));
        assertEquals(2, service.cart(1L).get(0).quantity());
    }
    @Test void diaryPrivateDataIsOnlyReadAndDeletedWithinOwnerScope() {
        User user=mock(User.class);
        when(user.getId()).thenReturn(2L);
        when(users.findById(2L)).thenReturn(Optional.of(user));
        when(progress.findById(2L)).thenReturn(Optional.empty());
        when(diaries.findByUserIdOrderByCreatedAtDesc(2L)).thenReturn(List.of());
        assertTrue(service.snapshot(2L).entries().isEmpty());
        when(users.findLockedById(2L)).thenReturn(Optional.of(user));
        when(diaries.findByUserIdAndClientId(2L, "owner1-id")).thenReturn(Optional.empty());
        service.deleteDiary(2L, "owner1-id");
        verify(diaries, never()).delete(any());
        verify(diaries, never()).findByUserIdAndClientId(eq(1L), anyString());
    }
    @Test void serverAwardsLoginOncePerDayAndCapsDiaryXp() {
        DiaryProgress state=new DiaryProgress(1L);
        LocalDate date=LocalDate.of(2026,10,7);
        assertEquals(15, state.awardLogin(date));
        assertEquals(0, state.awardLogin(date));
        for (int i=0; i<4; i++) assertEquals(100, state.awardDiary(date,100));
        assertEquals(0, state.awardDiary(date,100));
        assertEquals(415, state.getTotalXp());
        assertEquals(100, state.awardDiary(date.plusDays(1),100));
    }
    @Test void deletedDiaryTombstoneClearsPhotoAndPrivateContent() {
        DiaryInput input=new DiaryInput("legacy-id", 1L, null, "recipe", "https://example.com/photo.jpg", 5, "comment", "secret", 1000);
        CookingDiary diary=new CookingDiary(1L,input,true,1);
        diary.delete();
        assertTrue(diary.isDeleted());
        assertEquals("", diary.getPhotoUrl());
        assertNull(diary.getPrivateDiary());
    }
}
