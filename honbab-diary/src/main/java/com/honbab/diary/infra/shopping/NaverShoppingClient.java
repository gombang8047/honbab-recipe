package com.honbab.diary.infra.shopping;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class NaverShoppingClient {

    public List<Map<String, Object>> searchProducts(String keyword, int limit) {
        log.info("[MOCK] 네이버 쇼핑 상품 검색: keyword={}", keyword);
        return List.of(
                Map.of(
                        "productId", "nv_2001",
                        "productName", "[네이버] 신선 " + keyword,
                        "price", 3900,
                        "productUrl", "https://search.shopping.naver.com/catalog/nv_2001"
                )
        );
    }
}
