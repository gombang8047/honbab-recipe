package com.honbab.diary.infra.shopping;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Builder;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Slf4j
@Component
@RequiredArgsConstructor
public class KurlyApiClient {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    private static final String KURLY_SEARCH_API = "https://api.kurly.com/search/v4/sites/market/normal-search";

    @Getter
    @Builder
    public static class KurlyProductDto {
        private String productId;
        private String productName;
        private Integer price;
        private String productUrl;
        private String thumbnailUrl;
    }

    /**
     * 마켓컬리 상품 검색 (최상위 상품 리스트 반환)
     */
    public List<KurlyProductDto> searchProducts(String keyword, int limit) {
        List<KurlyProductDto> result = new ArrayList<>();
        try {
            URI uri = UriComponentsBuilder.fromHttpUrl(KURLY_SEARCH_API)
                    .queryParam("keyword", keyword)
                    .queryParam("page", 1)
                    .build()
                    .encode()
                    .toUri();

            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");
            headers.set("Accept", "application/json, text/plain, */*");
            headers.set("Accept-Language", "ko-KR,ko;q=0.9");
            headers.set("Origin", "https://www.kurly.com");
            headers.set("Referer", "https://www.kurly.com/");

            HttpEntity<Void> entity = new HttpEntity<>(headers);
            ResponseEntity<String> response = restTemplate.exchange(uri, HttpMethod.GET, entity, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                JsonNode listSections = root.path("data").path("listSections");

                if (listSections.isArray()) {
                    for (JsonNode section : listSections) {
                        if ("PRODUCT_LIST".equals(section.path("view").path("sectionCode").asText())) {
                            JsonNode items = section.path("data").path("items");
                            if (items.isArray()) {
                                for (JsonNode item : items) {
                                    if (result.size() >= limit) break;

                                    String no = item.path("no").asText();
                                    String name = item.path("name").asText();
                                    int salesPrice = item.path("salesPrice").asInt(0);
                                    String thumb = item.path("listImageUrl").asText("");

                                    if (!no.isEmpty() && salesPrice > 0) {
                                        result.add(KurlyProductDto.builder()
                                                .productId(no)
                                                .productName(name)
                                                .price(salesPrice)
                                                .productUrl("https://www.kurly.com/goods/" + no)
                                                .thumbnailUrl(thumb)
                                                .build());
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.error("마켓컬리 상품 검색 API 호출 중 오류 발생: keyword={}, error={}", keyword, e.getMessage());
        }

        return result;
    }

    /**
     * 특정 식재료의 1위 최적가 상품 단건 조회
     */
    public Optional<KurlyProductDto> getBestProduct(String keyword) {
        List<KurlyProductDto> list = searchProducts(keyword, 1);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }
}
