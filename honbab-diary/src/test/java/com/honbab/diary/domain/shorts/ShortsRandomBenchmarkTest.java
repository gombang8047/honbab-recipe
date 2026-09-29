package com.honbab.diary.domain.shorts;

import com.honbab.diary.domain.shorts.dto.ShortsResponse;
import com.honbab.diary.domain.shorts.entity.Shorts;
import com.honbab.diary.domain.shorts.repository.ShortsRepository;
import com.honbab.diary.domain.shorts.service.ShortsService;
import com.honbab.diary.domain.shorts.service.ShortsCrawlingService;
import com.honbab.diary.global.config.DataInitializer;
import com.honbab.diary.infra.shopping.DailyKurlyPriceScheduler;
import jakarta.persistence.EntityManagerFactory;
import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;
import java.util.*;
import java.util.function.Supplier;
import java.util.stream.Collectors;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(properties = {
    "spring.jpa.hibernate.ddl-auto=validate",
    "spring.flyway.enabled=false",
    "spring.jpa.show-sql=false",
    "spring.jpa.properties.hibernate.generate_statistics=true",
    "spring.jpa.properties.hibernate.query.fail_on_pagination_over_collection_fetch=true",
    "logging.level.org.hibernate.SQL=OFF",
    "logging.level.org.hibernate.orm.jdbc.bind=OFF",
    "logging.level.org.hibernate.stat=OFF",
    "logging.level.org.hibernate.engine.internal.StatisticalLoggingSessionEventListener=OFF"
})
@ActiveProfiles("dev")
public class ShortsRandomBenchmarkTest {
    @Autowired private ShortsRepository shortsRepository;
    @Autowired private ShortsService shortsService;
    @Autowired private PlatformTransactionManager transactionManager;
    @Autowired private EntityManagerFactory entityManagerFactory;

    // Disable unrelated startup writes/external calls. Measured repository/service/DB are real.
    @MockBean private DataInitializer dataInitializer;
    @MockBean private DailyKurlyPriceScheduler priceScheduler;
    @MockBean private ShortsCrawlingService crawlingService;

    private static final int ITERATIONS = 100;
    private static final int ROUNDS = 3;
    private static final int PAGE_SIZE = 8;
    private final Pageable pageable = PageRequest.of(0, PAGE_SIZE);

    @Test
    @DisplayName("Random feed baseline: restored DB random query with batch-loaded tags")
    void measureRestoredRandomShortsPerformance() {
        TransactionTemplate transaction = new TransactionTemplate(transactionManager);
        transaction.setReadOnly(true);
        transaction.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        Map<Long, ShortsResponse> expected = transaction.execute(status ->
            shortsRepository.findByStatus(Shorts.ShortsStatus.ACTIVE).stream()
                .map(ShortsResponse::from)
                .collect(Collectors.toMap(ShortsResponse::getId, value -> value)));
        assertThat(expected).isNotNull().isNotEmpty();
        long total = transaction.execute(status -> shortsRepository.count());
        Supplier<Page<ShortsResponse>> baseline = () -> shortsService.getRandom(pageable);
        Statistics stats = entityManagerFactory.unwrap(SessionFactory.class).getStatistics();
        for (int i = 0; i < 20; i++) {
            measure(transaction, baseline, stats, expected);
        }
        System.out.printf(Locale.ROOT,
            "%nBASELINE total=%d active=%d pageSize=%d warmup=20 rounds=%d iterationsPerRound=%d%n",
            total, expected.size(), PAGE_SIZE, ROUNDS, ITERATIONS);
        System.out.println("Restored RANDOM + batch-loaded tags + DTO; fresh read-only transaction per call; no HTTP/JSON/browser");
        System.out.println("Single implementation baseline, not a before/after improvement comparison");
        List<Sample> allSamples = new ArrayList<>();
        for (int round = 1; round <= ROUNDS; round++) {
            List<Sample> samples = new ArrayList<>();
            for (int i = 0; i < ITERATIONS; i++) {
                samples.add(measure(transaction, baseline, stats, expected));
            }
            report("round=" + round + " BASELINE", samples);
            allSamples.addAll(samples);
        }
        report("ALL BASELINE", allSamples);
        Long finalTotal = transaction.execute(status -> shortsRepository.count());
        List<Long> finalIds = transaction.execute(status -> shortsRepository.findByStatus(Shorts.ShortsStatus.ACTIVE).stream().map(Shorts::getId).toList());
        assertThat(finalTotal).isEqualTo(total);
        assertThat(finalIds).containsExactlyInAnyOrderElementsOf(expected.keySet());
        // Outside timing: verify partial/last/out-of-range pages and DTO tags.
        for (int pageNumber : new int[] {1, (expected.size() - 1) / PAGE_SIZE,
                (expected.size() + PAGE_SIZE - 1) / PAGE_SIZE}) {
            Pageable request = PageRequest.of(pageNumber, PAGE_SIZE);
            Page<ShortsResponse> result = transaction.execute(status -> shortsService.getRandom(request));
            int expectedSize = (int) Math.min(PAGE_SIZE,
                    Math.max(0L, expected.size() - request.getOffset()));
            assertThat(result).isNotNull();
            assertThat(result.getNumber()).isEqualTo(pageNumber);
            assertThat(result.getTotalElements()).isEqualTo(expected.size());
            assertThat(result.getContent()).hasSize(expectedSize);
            assertThat(result.getContent().stream().map(ShortsResponse::getId).toList()).doesNotHaveDuplicates();
            for (ShortsResponse dto : result.getContent()) {
                assertThat(expected).containsKey(dto.getId());
                assertThat(dto).usingRecursiveComparison().isEqualTo(expected.get(dto.getId()));
            }
        }
    }

    private Sample measure(TransactionTemplate transaction, Supplier<Page<ShortsResponse>> action,
                           Statistics stats, Map<Long, ShortsResponse> expected) {
        long statementsBefore = stats.getPrepareStatementCount();
        long start = System.nanoTime();
        Page<ShortsResponse> response = transaction.execute(status -> action.get());
        long elapsed = System.nanoTime() - start;
        long statements = stats.getPrepareStatementCount() - statementsBefore;
        // Assertions run outside timing. Random IDs differ, but each DTO must match real DB data.
        assertThat(response).isNotNull();
        assertThat(response.getTotalElements()).isEqualTo(expected.size());
        assertThat(response.getNumber()).isZero();
        assertThat(response.getSize()).isEqualTo(PAGE_SIZE);
        assertThat(response.getContent()).hasSize(Math.min(PAGE_SIZE, expected.size()));
        assertThat(response.getContent().stream().map(ShortsResponse::getId).toList()).doesNotHaveDuplicates();
        for (ShortsResponse dto : response.getContent()) {
            assertThat(expected).containsKey(dto.getId());
            assertThat(dto).usingRecursiveComparison().isEqualTo(expected.get(dto.getId()));
        }
        return new Sample(elapsed / 1_000_000.0, statements);
    }

    private static double mean(List<Sample> samples) {
        return samples.stream().mapToDouble(Sample::milliseconds).average().orElseThrow();
    }

    private static void report(String label, List<Sample> samples) {
        double[] times = samples.stream().mapToDouble(Sample::milliseconds).sorted().toArray();
        LongSummaryStatistics queries = samples.stream().mapToLong(Sample::statements).summaryStatistics();
        System.out.printf(Locale.ROOT,
            "%s n=%d mean=%.3fms p50=%.3fms p95=%.3fms min=%.3fms max=%.3fms SQL_mean=%.2f SQL_min=%d SQL_max=%d%n",
            label, times.length, mean(samples), times[(int) Math.ceil(times.length * .50) - 1],
            times[(int) Math.ceil(times.length * .95) - 1], times[0], times[times.length - 1],
            queries.getAverage(), queries.getMin(), queries.getMax());
    }

    private record Sample(double milliseconds, long statements) {}
}
