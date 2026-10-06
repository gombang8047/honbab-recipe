package com.honbab.diary.domain.cart;

import com.honbab.diary.domain.cart.entity.ProductMapping;
import com.honbab.diary.domain.cart.repository.ProductMappingRepository;
import com.honbab.diary.domain.recipe.entity.Recipe;
import com.honbab.diary.domain.recipe.repository.RecipeRepository;
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
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.LongSummaryStatistics;
import java.util.Map;
import java.util.function.Supplier;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(properties = {
        "spring.jpa.hibernate.ddl-auto=validate",
        "spring.flyway.enabled=false",
        "spring.jpa.show-sql=false",
        "spring.jpa.properties.hibernate.generate_statistics=true",
        "logging.level.org.hibernate.SQL=OFF",
        "logging.level.org.hibernate.orm.jdbc.bind=OFF",
        "logging.level.org.hibernate.stat=OFF",
        "logging.level.org.hibernate.engine.internal.StatisticalLoggingSessionEventListener=OFF"
})
@ActiveProfiles("dev")
class ProductMappingBatchLookupBenchmarkTest {

    @Autowired private RecipeRepository recipeRepository;
    @Autowired private ProductMappingRepository productMappingRepository;
    @Autowired private PlatformTransactionManager transactionManager;
    @Autowired private EntityManagerFactory entityManagerFactory;

    @MockBean private DataInitializer dataInitializer;
    @MockBean private DailyKurlyPriceScheduler priceScheduler;
    @MockBean private ShortsCrawlingService crawlingService;

    private static final int WARMUP = 20;
    private static final int ITERATIONS = 100;
    private static final int ROUNDS = 3;

    @Test
    @DisplayName("상품 매핑 N회 단건 조회와 IN 일괄 조회를 동일 결과 기준으로 비교")
    void compareRepeatedAndBatchLookup() {
        TransactionTemplate transaction = new TransactionTemplate(transactionManager);
        transaction.setReadOnly(true);
        transaction.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);

        List<Long> ingredientIds = transaction.execute(status -> recipeRepository.findAll().stream()
                .map(Recipe::getIngredients)
                .map(ingredients -> ingredients.stream()
                        .map(recipeIngredient -> recipeIngredient.getIngredient().getId())
                        .distinct()
                        .toList())
                .max((left, right) -> Integer.compare(left.size(), right.size()))
                .orElse(List.of()));
        assertThat(ingredientIds)
                .as("실제 dev DB에 재료가 연결된 레시피가 필요합니다")
                .isNotNull()
                .isNotEmpty();

        Supplier<Map<Long, MappingSnapshot>> repeated = () -> repeatedLookup(ingredientIds);
        Supplier<Map<Long, MappingSnapshot>> batch = () -> batchLookup(ingredientIds);
        Statistics statistics = entityManagerFactory.unwrap(SessionFactory.class).getStatistics();

        Map<Long, MappingSnapshot> expected = transaction.execute(status -> repeated.get());
        Map<Long, MappingSnapshot> actual = transaction.execute(status -> batch.get());
        assertThat(actual).containsExactlyInAnyOrderEntriesOf(expected);

        for (int i = 0; i < WARMUP; i++) {
            measure(transaction, repeated, statistics, expected);
            measure(transaction, batch, statistics, expected);
        }

        System.out.printf(Locale.ROOT,
                "%nPRODUCT_MAPPING ingredientIds=%d warmup=%d rounds=%d iterationsPerRound=%d%n",
                ingredientIds.size(), WARMUP, ROUNDS, ITERATIONS);
        System.out.println("BEFORE=N repeated findByIngredientId; AFTER=single IN query ordered by mapping id");
        System.out.println("Fresh read-only transaction per lookup; result equality verified; no cart writes/HTTP/JSON");

        List<Sample> allBefore = new ArrayList<>();
        List<Sample> allAfter = new ArrayList<>();
        for (int round = 1; round <= ROUNDS; round++) {
            List<Sample> before = new ArrayList<>();
            List<Sample> after = new ArrayList<>();
            for (int i = 0; i < ITERATIONS; i++) {
                if ((round + i) % 2 == 0) {
                    before.add(measure(transaction, repeated, statistics, expected));
                    after.add(measure(transaction, batch, statistics, expected));
                } else {
                    after.add(measure(transaction, batch, statistics, expected));
                    before.add(measure(transaction, repeated, statistics, expected));
                }
            }
            report("round=" + round + " BEFORE", before);
            report("round=" + round + " AFTER", after);
            allBefore.addAll(before);
            allAfter.addAll(after);
        }

        report("ALL BEFORE", allBefore);
        report("ALL AFTER", allAfter);
        double change = (mean(allAfter) - mean(allBefore)) / mean(allBefore) * 100.0;
        System.out.printf(Locale.ROOT, "MEAN_CHANGE=%+.2f%%%n", change);
    }

    private Map<Long, MappingSnapshot> repeatedLookup(List<Long> ingredientIds) {
        Map<Long, MappingSnapshot> result = new LinkedHashMap<>();
        for (Long ingredientId : ingredientIds) {
            productMappingRepository.findByIngredientId(ingredientId).stream()
                    .min((left, right) -> Long.compare(left.getId(), right.getId()))
                    .map(MappingSnapshot::from)
                    .ifPresent(snapshot -> result.put(ingredientId, snapshot));
        }
        return result;
    }

    private Map<Long, MappingSnapshot> batchLookup(List<Long> ingredientIds) {
        Map<Long, MappingSnapshot> result = new LinkedHashMap<>();
        productMappingRepository.findByIngredientIdInOrderByIdAsc(ingredientIds)
                .forEach(mapping -> result.putIfAbsent(
                        mapping.getIngredient().getId(), MappingSnapshot.from(mapping)));
        return result;
    }

    private Sample measure(TransactionTemplate transaction,
                           Supplier<Map<Long, MappingSnapshot>> action,
                           Statistics statistics,
                           Map<Long, MappingSnapshot> expected) {
        long statementsBefore = statistics.getPrepareStatementCount();
        long start = System.nanoTime();
        Map<Long, MappingSnapshot> result = transaction.execute(status -> action.get());
        long elapsed = System.nanoTime() - start;
        long statements = statistics.getPrepareStatementCount() - statementsBefore;
        assertThat(result).containsExactlyInAnyOrderEntriesOf(expected);
        return new Sample(elapsed / 1_000_000.0, statements);
    }

    private static double mean(List<Sample> samples) {
        return samples.stream().mapToDouble(Sample::milliseconds).average().orElseThrow();
    }

    private static void report(String label, List<Sample> samples) {
        double[] times = samples.stream().mapToDouble(Sample::milliseconds).sorted().toArray();
        LongSummaryStatistics statements = samples.stream()
                .mapToLong(Sample::statements)
                .summaryStatistics();
        System.out.printf(Locale.ROOT,
                "%s n=%d mean=%.3fms p50=%.3fms p95=%.3fms min=%.3fms max=%.3fms SQL_mean=%.2f SQL_min=%d SQL_max=%d%n",
                label, times.length, mean(samples), percentile(times, .50), percentile(times, .95),
                times[0], times[times.length - 1], statements.getAverage(),
                statements.getMin(), statements.getMax());
    }

    private static double percentile(double[] sortedTimes, double percentile) {
        return sortedTimes[(int) Math.ceil(sortedTimes.length * percentile) - 1];
    }

    private record MappingSnapshot(Long id, Long ingredientId, String platform,
                                   String productId, String productName, Integer price) {
        private static MappingSnapshot from(ProductMapping mapping) {
            return new MappingSnapshot(mapping.getId(), mapping.getIngredient().getId(),
                    mapping.getPlatform(), mapping.getProductId(), mapping.getProductName(),
                    mapping.getPrice());
        }
    }

    private record Sample(double milliseconds, long statements) {}
}
