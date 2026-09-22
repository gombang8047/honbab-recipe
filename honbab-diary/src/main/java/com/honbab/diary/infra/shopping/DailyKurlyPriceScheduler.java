package com.honbab.diary.infra.shopping;

import com.honbab.diary.domain.cart.service.ShoppingPriceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.concurrent.CompletableFuture;

@Slf4j
@Component
@RequiredArgsConstructor
public class DailyKurlyPriceScheduler {

    private final ShoppingPriceService shoppingPriceService;

    /**
     * 매일 새벽 4시 정각에 마켓컬리 주요 식재료 최신 가격 자동 동기화
     */
    @Scheduled(cron = "0 0 4 * * *")
    public void scheduleDailyPriceSync() {
        log.info("[스케줄러] 매일 새벽 4시 마켓컬리 식재료 가격 자동 동기화를 실행합니다.");
        int synced = shoppingPriceService.syncAllCoreIngredients();
        log.info("[스케줄러] 동기화 작업 완료: {}개 식재료 가격 갱신", synced);
    }

    /**
     * 서버 최초 기동 완료 후, 비동기 백그라운드로 1회 초기 가격 동기화
     * (서버 부팅 속도에 영향을 주지 않도록 별도 스레드에서 실행)
     */
    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        CompletableFuture.runAsync(() -> {
            try {
                log.info("[초기화] 서버 부팅 완료 후 마켓컬리 초기 가격 동기화를 백그라운드에서 시작합니다.");
                // DB나 캐시에 이미 데이터가 있는지 확인 후 필요시 동기화
                int synced = shoppingPriceService.syncAllCoreIngredients();
                log.info("[초기화] 마켓컬리 초기 가격 동기화 완료: {}건", synced);
            } catch (Exception e) {
                log.warn("[초기화] 마켓컬리 초기 가격 동기화 중 오류 (일부 품목 건너뜀): {}", e.getMessage());
            }
        });
    }
}
