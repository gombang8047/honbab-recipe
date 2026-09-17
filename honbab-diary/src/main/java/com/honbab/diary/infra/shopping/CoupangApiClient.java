package com.honbab.diary.infra.shopping;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class CoupangApiClient {

    public List<Map<String, Object>> searchProducts(String keyword, int limit) {
        log.info("쿠팡 상품 검색 URL 생성: keyword={}", keyword);
        String encoded = URLEncoder.encode(keyword, StandardCharsets.UTF_8);
        return List.of(
                Map.of(
                        "productId", "cp_" + Math.abs(keyword.hashCode()),
                        "productName", "[쿠팡] " + keyword,
                        "price", 4500,
                        "productUrl", "https://www.coupang.com/np/search?q=" + encoded
                )
        );
    }

    public String generateDeepLink(String productUrl) {
        return productUrl;
    }
}
