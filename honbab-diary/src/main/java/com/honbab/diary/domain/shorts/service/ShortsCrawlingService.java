package com.honbab.diary.domain.shorts.service;

import com.honbab.diary.domain.shorts.dto.CrawlResultResponse;
import com.honbab.diary.domain.shorts.entity.Shorts;
import com.honbab.diary.domain.shorts.entity.Tag;
import com.honbab.diary.domain.shorts.repository.ShortsRepository;
import com.honbab.diary.domain.shorts.repository.TagRepository;
import com.honbab.diary.infra.youtube.YoutubeApiClient;
import com.honbab.diary.infra.youtube.YoutubeDataParser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class ShortsCrawlingService {

    private final YoutubeApiClient youtubeApiClient;
    private final YoutubeDataParser youtubeDataParser;
    private final ShortsRepository shortsRepository;
    private final TagRepository tagRepository;

    /**
     * 자취생 요리 특화 검색 키워드 풀 (25개 인기 요리/재료/상황별)
     */
    public static final List<String> SEARCH_KEYWORDS = List.of(
            "자취요리",
            "원팬요리",
            "전자레인지 요리",
            "자취생 초간단 요리",
            "스팸요리",
            "계란요리",
            "혼밥레시피",
            "자취생 1인분 요리",
            "김치볶음밥 레시피",
            "라면 맛있게 끓이는법",
            "삼겹살 볶음밥",
            "참치마요 덮밥",
            "간단 야식",
            "에어프라이어 자취요리",
            "초간단 파스타",
            "두부 요리 자취",
            "냉장고 파먹기 요리",
            "자취생 아침밥",
            "1인분 찌개",
            "자취 가성비 요리",
            "순두부 열라면",
            "초간단 볶음밥",
            "자취 술안주",
            "토스트 초간단",
            "닭가슴살 혼밥"
    );

    /**
     * 크롤링 제외 블랙리스트 (단순 먹방, 식사, 맛집 탐방 등 레시피가 아닌 영상 차단)
     */
    public static final List<String> EXCLUDE_KEYWORDS = List.of(
            "먹방",
            "mukbang",
            "asmr",
            "리얼사운드",
            "식폭행",
            "대식가",
            "맛집",
            "뷔페",
            "탐방",
            "통째로 먹기",
            "푸드파이터",
            "배달음식"
    );

    /**
     * 먹방/비레시피 영상 필터링 판별
     */
    private boolean isExcludedVideo(String title, String channelName, Set<String> tags) {
        String lowerTitle = (title != null ? title.toLowerCase() : "");
        String lowerChannel = (channelName != null ? channelName.toLowerCase() : "");

        for (String black : EXCLUDE_KEYWORDS) {
            String lowerBlack = black.toLowerCase();
            if (lowerTitle.contains(lowerBlack) || lowerChannel.contains(lowerBlack)) {
                return true;
            }
            if (tags != null && tags.stream().anyMatch(t -> t.toLowerCase().contains(lowerBlack))) {
                return true;
            }
        }
        return false;
    }

    /**
     * 매일 오전 6시, 오후 6시 정기 크롤링 (하루 2회)
     */
    @Scheduled(cron = "0 0 6,18 * * *")
    @Transactional
    public void scheduledCrawl() {
        log.info("=== [정기 크롤링] 유튜브 자취생 요리 쇼츠 크롤링 시작 ===");
        int totalNewSaved = 0;

        for (String keyword : SEARCH_KEYWORDS.subList(0, Math.min(8, SEARCH_KEYWORDS.size()))) {
            try {
                CrawlResultResponse result = crawlByKeyword(keyword, 10);
                totalNewSaved += result.getNewlySavedCount();
            } catch (Exception e) {
                log.error("키워드 '{}' 크롤링 중 오류: {}", keyword, e.getMessage());
            }
        }

        log.info("=== [정기 크롤링] 완료: 총 {}건 신규 쇼츠 저장 ===", totalNewSaved);
    }

    /**
     * 특정 키워드로 쇼츠 수동 크롤링 실행
     */
    @Transactional
    public CrawlResultResponse crawlByKeyword(String keyword, int maxResults) {
        log.info("쇼츠 크롤링 실행: keyword={}, maxResults={}", keyword, maxResults);

        // 1단계: 검색 API로 쇼츠 목록 획득
        List<Map<String, Object>> searchResults = youtubeApiClient.searchShorts(keyword, maxResults);
        if (searchResults.isEmpty()) {
            return CrawlResultResponse.builder()
                    .keyword(keyword)
                    .searchedCount(0)
                    .newlySavedCount(0)
                    .skippedDuplicateCount(0)
                    .savedTitles(Collections.emptyList())
                    .build();
        }

        // 2단계: 신규 영상 ID 필터링 (중복 제외)
        List<String> newVideoIds = new ArrayList<>();
        int duplicateCount = 0;

        for (Map<String, Object> item : searchResults) {
            String videoId = youtubeDataParser.extractYoutubeId(item);
            if (videoId == null || videoId.isBlank()) {
                continue;
            }

            if (shortsRepository.existsByYoutubeId(videoId)) {
                duplicateCount++;
                log.debug("이미 존재하는 쇼츠 건너뜀: {}", videoId);
            } else {
                newVideoIds.add(videoId);
            }
        }

        if (newVideoIds.isEmpty()) {
            log.info("검색된 {}건 모두 이미 수집된 영상입니다 (중복 {}건)", searchResults.size(), duplicateCount);
            return CrawlResultResponse.builder()
                    .keyword(keyword)
                    .searchedCount(searchResults.size())
                    .newlySavedCount(0)
                    .skippedDuplicateCount(duplicateCount)
                    .savedTitles(Collections.emptyList())
                    .build();
        }

        // 3단계: 신규 영상 상세/통계 일괄 조회 (조회수, 재생시간, 태그)
        List<Map<String, Object>> videoDetails = youtubeApiClient.getVideoDetails(newVideoIds);
        List<String> savedTitles = new ArrayList<>();

        for (Map<String, Object> detail : videoDetails) {
            try {
                String videoId = youtubeDataParser.extractYoutubeId(detail);
                if (shortsRepository.existsByYoutubeId(videoId)) {
                    continue;
                }

                // Shorts 엔티티 파싱
                Shorts shorts = youtubeDataParser.parseToShorts(detail);

                // 태그 추출 및 매핑
                Set<String> tagNames = youtubeDataParser.extractTags(detail);

                // 먹방/비레시피 영상 필터링 제외
                if (isExcludedVideo(shorts.getTitle(), shorts.getChannelName(), tagNames)) {
                    log.info("먹방/비레시피 영상 제외 건너뜀: [{}] {}", shorts.getChannelName(), shorts.getTitle());
                    continue;
                }

                for (String tagName : tagNames) {
                    Tag tag = tagRepository.findByName(tagName)
                            .orElseGet(() -> tagRepository.save(new Tag(tagName)));
                    shorts.addTag(tag);
                }

                shortsRepository.save(shorts);
                savedTitles.add(shorts.getTitle());
                log.info("새로운 쇼츠 저장 완료: [조회수: {}회] {} ({})",
                        shorts.getViewCount(), shorts.getTitle(), shorts.getVideoUrl());
            } catch (Exception e) {
                log.error("쇼츠 저장 실패: {}", e.getMessage(), e);
            }
        }

        return CrawlResultResponse.builder()
                .keyword(keyword)
                .searchedCount(searchResults.size())
                .newlySavedCount(savedTitles.size())
                .skippedDuplicateCount(duplicateCount)
                .savedTitles(savedTitles)
                .build();
    }
}
