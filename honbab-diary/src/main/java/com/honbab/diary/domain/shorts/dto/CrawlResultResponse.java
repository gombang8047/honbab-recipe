package com.honbab.diary.domain.shorts.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Schema(description = "쇼츠 크롤링 결과 응답")
@Getter
@Builder
public class CrawlResultResponse {

    @Schema(description = "검색 키워드", example = "자취요리")
    private String keyword;

    @Schema(description = "유튜브에서 검색된 쇼츠 수", example = "10")
    private int searchedCount;

    @Schema(description = "신규 저장된 쇼츠 수", example = "8")
    private int newlySavedCount;

    @Schema(description = "중복으로 제외된 쇼츠 수", example = "2")
    private int skippedDuplicateCount;

    @Schema(description = "신규 저장된 쇼츠 제목 목록")
    private List<String> savedTitles;
}
