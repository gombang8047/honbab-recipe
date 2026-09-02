package com.honbab.diary.domain.shorts.service;

import com.honbab.diary.domain.shorts.dto.ShortsDetailResponse;
import com.honbab.diary.domain.shorts.dto.ShortsResponse;
import com.honbab.diary.domain.shorts.entity.Shorts;
import com.honbab.diary.domain.shorts.entity.UserRecipeBookmark;
import com.honbab.diary.domain.shorts.repository.BookmarkRepository;
import com.honbab.diary.domain.shorts.repository.ShortsRepository;
import com.honbab.diary.domain.recipe.repository.RecipeRepository;
import com.honbab.diary.domain.user.entity.User;
import com.honbab.diary.domain.user.service.UserService;
import com.honbab.diary.global.exception.BusinessException;
import com.honbab.diary.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ShortsService {

    private final ShortsRepository shortsRepository;
    private final BookmarkRepository bookmarkRepository;
    private final RecipeRepository recipeRepository;
    private final UserService userService;

    /**
     * 쇼츠 피드 조회 (최신순)
     */
    public Page<ShortsResponse> getFeed(Pageable pageable) {
        return shortsRepository.findActiveShortsOrderByCreatedAtDesc(pageable)
                .map(ShortsResponse::from);
    }

    /**
     * 인기 쇼츠 조회 (조회수순)
     */
    public Page<ShortsResponse> getTrending(Pageable pageable) {
        return shortsRepository.findTrendingShorts(pageable)
                .map(ShortsResponse::from);
    }

    /**
     * 쇼츠 상세 조회
     */
    public ShortsDetailResponse getDetail(Long shortsId, Long userId) {
        Shorts shorts = findShortsById(shortsId);
        boolean bookmarked = userId != null && bookmarkRepository.existsByUserIdAndShortsId(userId, shortsId);
        boolean hasRecipe = recipeRepository.existsByShortsId(shortsId);
        return ShortsDetailResponse.from(shorts, bookmarked, hasRecipe);
    }

    /**
     * 북마크 추가
     */
    @Transactional
    public void addBookmark(Long shortsId, Long userId) {
        Shorts shorts = findShortsById(shortsId);
        User user = userService.findById(userId);

        if (!bookmarkRepository.existsByUserIdAndShortsId(userId, shortsId)) {
            bookmarkRepository.save(new UserRecipeBookmark(user, shorts));
        }
    }

    /**
     * 북마크 제거
     */
    @Transactional
    public void removeBookmark(Long shortsId, Long userId) {
        bookmarkRepository.deleteByUserIdAndShortsId(userId, shortsId);
    }

    public Shorts findShortsById(Long id) {
        return shortsRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.SHORTS_NOT_FOUND));
    }
}
