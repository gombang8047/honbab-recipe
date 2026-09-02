package com.honbab.diary.domain.shorts.service;

import com.honbab.diary.domain.shorts.entity.Shorts;
import com.honbab.diary.domain.shorts.entity.Tag;
import com.honbab.diary.domain.shorts.repository.ShortsRepository;
import com.honbab.diary.infra.youtube.YoutubeApiClient;
import com.honbab.diary.infra.youtube.YoutubeDataParser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ShortsCrawlingService {

    private final YoutubeApiClient youtubeApiClient;
    private final YoutubeDataParser youtubeDataParser;
    private final ShortsRepository shortsRepository;

    private static final List<String> SEARCH_KEYWORDS = List.of(
            "자취요리", "혼밥레시피", "1인분요리", "자취생레시피", "간단요리"
    );

    /**
     * 매일 오전 6시, 오후 6시에 크롤링 실행
     */
    @Scheduled(cron = "0 0 6,18 * * *")
    @Transactional
    public void crawlShorts() {
        log.info("=== 유튜브 쇼츠 크롤링 시작 ===");
        int totalCrawled = 0;

        for (String keyword : SEARCH_KEYWORDS) {
            try {
                List<Map<String, Object>> results = youtubeApiClient.searchShorts(keyword, 10);

                for (Map<String, Object> result : results) {
                    String youtubeId = youtubeDataParser.extractYoutubeId(result);

                    if (shortsRepository.existsByYoutubeId(youtubeId)) {
                        log.debug("이미 존재하는 쇼츠: {}", youtubeId);
                        continue;
                    }

                    Shorts shorts = youtubeDataParser.parseToShorts(result);
                    shortsRepository.save(shorts);
                    totalCrawled++;
                    log.info("새로운 쇼츠 저장: {} - {}", youtubeId, shorts.getTitle());
                }
            } catch (Exception e) {
                log.error("키워드 '{}' 크롤링 실패: {}", keyword, e.getMessage());
            }
        }

        log.info("=== 크롤링 완료: {}건 신규 저장 ===", totalCrawled);
    }

    /**
     * 수동 크롤링 트리거
     */
    @Transactional
    public int manualCrawl(String keyword, int maxResults) {
        log.info("수동 크롤링 시작: keyword={}, maxResults={}", keyword, maxResults);
        List<Map<String, Object>> results = youtubeApiClient.searchShorts(keyword, maxResults);
        int crawled = 0;

        for (Map<String, Object> result : results) {
            String youtubeId = youtubeDataParser.extractYoutubeId(result);
            if (!shortsRepository.existsByYoutubeId(youtubeId)) {
                Shorts shorts = youtubeDataParser.parseToShorts(result);
                shortsRepository.save(shorts);
                crawled++;
            }
        }

        return crawled;
    }
}
