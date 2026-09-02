package com.honbab.diary.infra.shopping;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class CoupangApiClient {

    public List<Map<String, Object>> searchProducts(String keyword, int limit) {
        log.info("[MOCK] 쿠팡 상품 검색: keyword={}", keyword);
        return List.of(
                Map.of(
                        "productId", "cp_1001",
                        "productName", "[쿠팡] Fresh " + keyword + " 1kg",
                        "price", 4500,
                        "productUrl", "https://www.coupang.com/vp/products/cp_1001"
                )
        );
    }

    public String generateDeepLink(String productUrl) {
        return "https://link.coupang.com/re/AFFSDP?lptag=AF123456&pageKey=" + productUrl;
    }
}
