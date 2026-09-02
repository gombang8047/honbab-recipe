package com.honbab.diary.domain.cart.service;

import com.honbab.diary.infra.shopping.CoupangApiClient;
import com.honbab.diary.infra.shopping.NaverShoppingClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/**
 * 외부 쇼핑몰 연동 서비스
 * 재료명으로 쇼핑몰 상품을 검색하고, 딥링크를 생성합니다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ShoppingIntegrationService {

    private final CoupangApiClient coupangApiClient;
    private final NaverShoppingClient naverShoppingClient;

    /**
     * 재료명으로 상품 검색 (네이버 쇼핑 우선)
     */
    public List<Map<String, Object>> searchProducts(String ingredientName) {
        try {
            return naverShoppingClient.searchProducts(ingredientName, 5);
        } catch (Exception e) {
            log.warn("네이버 쇼핑 검색 실패, 쿠팡으로 대체: {}", e.getMessage());
            return coupangApiClient.searchProducts(ingredientName, 5);
        }
    }

    /**
     * 상품 딥링크 생성 (쿠팡 파트너스)
     */
    public String generateDeepLink(String productUrl) {
        return coupangApiClient.generateDeepLink(productUrl);
    }
}
