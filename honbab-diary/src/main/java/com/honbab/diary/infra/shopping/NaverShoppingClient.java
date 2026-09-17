package com.honbab.diary.infra.shopping;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class NaverShoppingClient {

    public List<Map<String, Object>> searchProducts(String keyword, int limit) {
        log.info("네이버 쇼핑 상품 검색 URL 생성: keyword={}", keyword);
        String encoded = URLEncoder.encode(keyword, StandardCharsets.UTF_8);
        return List.of(
                Map.of(
                        "productId", "nv_" + Math.abs(keyword.hashCode()),
                        "productName", "[네이버] " + keyword,
                        "price", 3900,
                        "productUrl", "https://search.shopping.naver.com/search/all?query=" + encoded
                )
        );
    }
}
