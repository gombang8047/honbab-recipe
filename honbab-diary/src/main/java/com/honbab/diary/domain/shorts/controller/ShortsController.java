package com.honbab.diary.domain.shorts.controller;

import com.honbab.diary.domain.shorts.dto.ShortsDetailResponse;
import com.honbab.diary.domain.shorts.dto.ShortsResponse;
import com.honbab.diary.domain.shorts.service.ShortsService;
import com.honbab.diary.global.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@Tag(name = "쇼츠", description = "유튜브 쇼츠 피드 / 검색 / 북마크 API")
@RestController
@RequestMapping("/api/v1/shorts")
@RequiredArgsConstructor
public class ShortsController {

    private final ShortsService shortsService;

    @Operation(summary = "쇼츠 피드", description = "최신 쇼츠 피드를 페이지네이션으로 조회합니다.")
    @GetMapping
    public ResponseEntity<ApiResponse<Page<ShortsResponse>>> getFeed(
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(shortsService.getFeed(pageable)));
    }

    @Operation(summary = "인기 쇼츠", description = "조회수 기준 인기 쇼츠를 조회합니다.")
    @GetMapping("/trending")
    public ResponseEntity<ApiResponse<Page<ShortsResponse>>> getTrending(
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(shortsService.getTrending(pageable)));
    }

    @Operation(summary = "쇼츠 상세", description = "쇼츠 상세 정보를 조회합니다.")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ShortsDetailResponse>> getDetail(
            @PathVariable Long id, Authentication authentication) {
        Long userId = authentication != null ? (Long) authentication.getPrincipal() : null;
        return ResponseEntity.ok(ApiResponse.ok(shortsService.getDetail(id, userId)));
    }

    @Operation(summary = "북마크 추가", description = "쇼츠를 북마크에 추가합니다.")
    @PostMapping("/{id}/bookmark")
    public ResponseEntity<ApiResponse<Void>> addBookmark(
            @PathVariable Long id, Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        shortsService.addBookmark(id, userId);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @Operation(summary = "북마크 제거", description = "쇼츠 북마크를 제거합니다.")
    @DeleteMapping("/{id}/bookmark")
    public ResponseEntity<ApiResponse<Void>> removeBookmark(
            @PathVariable Long id, Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        shortsService.removeBookmark(id, userId);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
