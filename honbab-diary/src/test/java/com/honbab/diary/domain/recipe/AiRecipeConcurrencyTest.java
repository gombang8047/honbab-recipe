package com.honbab.diary.domain.recipe;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.honbab.diary.domain.recipe.dto.RecipeDetailResponse;
import com.honbab.diary.domain.recipe.entity.Recipe;
import com.honbab.diary.domain.recipe.repository.IngredientRepository;
import com.honbab.diary.domain.recipe.repository.RecipeRepository;
import com.honbab.diary.domain.recipe.service.AiRecipeService;
import com.honbab.diary.domain.shorts.entity.Shorts;
import com.honbab.diary.domain.shorts.repository.ShortsRepository;
import com.honbab.diary.domain.shorts.service.ShortsService;
import com.honbab.diary.global.exception.BusinessException;
import com.honbab.diary.global.exception.ErrorCode;
import com.honbab.diary.infra.gemini.GeminiApiClient;
import com.honbab.diary.infra.gemini.GeminiPromptBuilder;
import com.honbab.diary.infra.youtube.YoutubeApiClient;
import com.zaxxer.hikari.HikariDataSource;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionTemplate;

import javax.sql.DataSource;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@DataJpaTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:ai-concurrency;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;INIT=CREATE DOMAIN IF NOT EXISTS JSONB AS JSON",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa", "spring.datasource.password=",
        "spring.datasource.hikari.maximum-pool-size=4",
        "spring.jpa.hibernate.ddl-auto=create-drop", "spring.flyway.enabled=false",
        "spring.jpa.show-sql=false", "logging.level.org.hibernate.SQL=WARN"
})
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("ai-concurrency-test")
@Import({AiRecipeService.class, GeminiPromptBuilder.class, ObjectMapper.class})
@Transactional(propagation = Propagation.NOT_SUPPORTED)
class AiRecipeConcurrencyTest {
    private static final AtomicInteger IDS = new AtomicInteger();
    private static final String JSON = """
            {"title":"계란밥","ingredients":[{"name":"계란","amount":"1","unit":"개"}],
             "steps":[{"order":1,"description":"계란을 익힌다.","timer_seconds":60}]}
            """;
    @Autowired AiRecipeService service;
    @Autowired ShortsRepository shortsRepository;
    @Autowired RecipeRepository recipes;
    @Autowired IngredientRepository ingredients;
    @Autowired PlatformTransactionManager transactionManager;
    @Autowired DataSource dataSource;
    @MockBean ShortsService shortsService;
    @MockBean GeminiApiClient gemini;
    @MockBean YoutubeApiClient youtube;

    @BeforeEach
    void setUp() {
        when(shortsService.findShortsById(anyLong())).thenAnswer(call ->
                shortsRepository.findById(call.getArgument(0)).orElseThrow());
        when(gemini.generateRecipeJson(anyString(), anyString(), anyString())).thenReturn(JSON);
    }

    @Test
    @DisplayName("동일 쇼츠 8개 동시 요청은 댓글·Gemini 1회 호출과 결과를 공유한다")
    void concurrentRequestsShareOneGeneration() throws Exception {
        Shorts shorts = newShorts();
        CountDownLatch entered = new CountDownLatch(1), release = new CountDownLatch(1);
        when(gemini.generateRecipeJson(anyString(), anyString(), anyString())).thenAnswer(call -> {
            entered.countDown();
            assertThat(release.await(10, TimeUnit.SECONDS)).isTrue();
            return JSON;
        });
        ExecutorService pool = Executors.newFixedThreadPool(8);
        try {
            Future<RecipeDetailResponse> leader = pool.submit(() -> service.convertShortsToRecipe(shorts.getId()));
            assertThat(entered.await(10, TimeUnit.SECONDS)).isTrue();
            List<Future<RecipeDetailResponse>> followers = new ArrayList<>();
            for (int i = 0; i < 7; i++) followers.add(pool.submit(() -> service.convertShortsToRecipe(shorts.getId())));
            awaitFollowers(7);
            release.countDown();
            RecipeDetailResponse result = leader.get(10, TimeUnit.SECONDS);
            for (Future<RecipeDetailResponse> follower : followers)
                assertThat(follower.get(10, TimeUnit.SECONDS)).isSameAs(result);
            assertThat(result.getIngredients()).hasSize(1);
            assertThat(result.getSteps().get(0).getTimerSeconds()).isEqualTo(60);
            assertThat(recipes.findByShortsId(shorts.getId())).isPresent();
            assertThat(service.convertShortsToRecipe(shorts.getId()).getId()).isEqualTo(result.getId());
            verify(gemini, times(1)).generateRecipeJson(anyString(), eq(shorts.getYoutubeId()), anyString());
            verify(youtube, times(1)).getTopComment(shorts.getYoutubeId());
            verifyNoMoreInteractions(gemini, youtube);
            System.out.println("AI_CONCURRENCY requests=8 youtubeCalls=1 geminiCalls=1 sharedResults=8");
        } finally {
            release.countDown();
            pool.shutdownNow();
        }
    }

    @Test
    @DisplayName("댓글·Gemini 실행 시 트랜잭션과 Hikari 활성 DB 연결이 없다")
    void externalCallsReleaseDatabaseConnection() {
        Shorts shorts = newShorts();
        when(youtube.getTopComment(anyString())).thenAnswer(call -> { assertExternalBoundary(); return "계란 1개"; });
        when(gemini.generateRecipeJson(anyString(), anyString(), anyString())).thenAnswer(call -> {
            assertExternalBoundary();
            return JSON;
        });
        assertThat(service.convertShortsToRecipe(shorts.getId()).getIngredients().get(0).getName()).isEqualTo("계란");
        assertThat(recipes.findByShortsId(shorts.getId())).isPresent();
        System.out.println("AI_TRANSACTION externalTransactionActive=false externalActiveConnections=0");
    }

    @Test
    @DisplayName("서로 다른 쇼츠의 분석은 전역 잠금 없이 동시에 진행된다")
    void differentShortsRunIndependently() throws Exception {
        Shorts first = newShorts(), second = newShorts();
        CyclicBarrier barrier = new CyclicBarrier(2);
        when(gemini.generateRecipeJson(anyString(), anyString(), anyString())).thenAnswer(call -> {
            barrier.await(10, TimeUnit.SECONDS);
            return "{\"title\":\"병렬 레시피\"}";
        });
        ExecutorService pool = Executors.newFixedThreadPool(2);
        try {
            Future<RecipeDetailResponse> a = pool.submit(() -> service.convertShortsToRecipe(first.getId()));
            Future<RecipeDetailResponse> b = pool.submit(() -> service.convertShortsToRecipe(second.getId()));
            assertThat(a.get(10, TimeUnit.SECONDS).getShortsId()).isEqualTo(first.getId());
            assertThat(b.get(10, TimeUnit.SECONDS).getShortsId()).isEqualTo(second.getId());
            verify(gemini, times(2)).generateRecipeJson(anyString(), anyString(), anyString());
        } finally { pool.shutdownNow(); }
    }

    @Test
    @DisplayName("실패를 대기자에게 전달하고 다음 요청에서 재시도할 수 있다")
    void failureIsSharedAndCanBeRetried() throws Exception {
        Shorts shorts = newShorts();
        CountDownLatch entered = new CountDownLatch(1), release = new CountDownLatch(1);
        BusinessException failure = new BusinessException(ErrorCode.AI_CONVERSION_FAILED, "테스트 오류");
        when(gemini.generateRecipeJson(anyString(), anyString(), anyString())).thenAnswer(call -> {
            entered.countDown();
            assertThat(release.await(10, TimeUnit.SECONDS)).isTrue();
            throw failure;
        });
        ExecutorService pool = Executors.newFixedThreadPool(2);
        try {
            Future<RecipeDetailResponse> leader = pool.submit(() -> service.convertShortsToRecipe(shorts.getId()));
            assertThat(entered.await(10, TimeUnit.SECONDS)).isTrue();
            Future<RecipeDetailResponse> follower = pool.submit(() -> service.convertShortsToRecipe(shorts.getId()));
            awaitFollowers(1);
            release.countDown();
            assertThatThrownBy(() -> leader.get(10, TimeUnit.SECONDS)).hasCause(failure);
            assertThatThrownBy(() -> follower.get(10, TimeUnit.SECONDS)).hasCause(failure);
            assertThat(recipes.findByShortsId(shorts.getId())).isEmpty();
            // Restub without invoking the existing answer, which intentionally throws.
            doReturn(JSON).when(gemini).generateRecipeJson(anyString(), anyString(), anyString());
            assertThat(service.convertShortsToRecipe(shorts.getId()).getId()).isNotNull();
            verify(gemini, times(2)).generateRecipeJson(anyString(), anyString(), anyString());
        } finally { release.countDown(); pool.shutdownNow(); }
    }

    @Test
    @DisplayName("저장 중 오류가 나면 새 재료도 함께 롤백한다")
    void failedSaveRollsBackIngredients() {
        Shorts shorts = newShorts();
        String name = "롤백재료" + IDS.incrementAndGet();
        when(gemini.generateRecipeJson(anyString(), anyString(), anyString())).thenReturn(
                "{\"ingredients\":[{\"name\":\"" + name + "\",\"is_essential\":\"invalid\"}]}");
        assertThatThrownBy(() -> service.convertShortsToRecipe(shorts.getId())).isInstanceOf(BusinessException.class);
        assertThat(ingredients.findByName(name)).isEmpty();
        assertThat(recipes.findByShortsId(shorts.getId())).isEmpty();
    }

    @Test
    @DisplayName("분석 중 다른 서버가 저장한 결과가 있으면 저장 전에 재사용한다")
    void rechecksCacheBeforeSaving() {
        Shorts shorts = newShorts();
        when(gemini.generateRecipeJson(anyString(), anyString(), anyString())).thenAnswer(call -> {
            new TransactionTemplate(transactionManager).executeWithoutResult(status ->
                    recipes.saveAndFlush(Recipe.builder().shorts(shortsRepository.findById(shorts.getId()).orElseThrow())
                            .title("먼저 저장됨").build()));
            return JSON;
        });
        assertThat(service.convertShortsToRecipe(shorts.getId()).getTitle()).isEqualTo("먼저 저장됨");
    }

    @Test
    @DisplayName("호출자의 트랜잭션을 중단하고 분석 완료 후 복원한다")
    void suspendsCallerTransaction() {
        Shorts shorts = newShorts();
        when(gemini.generateRecipeJson(anyString(), anyString(), anyString())).thenAnswer(call -> {
            assertThat(TransactionSynchronizationManager.isActualTransactionActive()).isFalse();
            return JSON;
        });
        new TransactionTemplate(transactionManager).executeWithoutResult(status -> {
            assertThat(TransactionSynchronizationManager.isActualTransactionActive()).isTrue();
            service.convertShortsToRecipe(shorts.getId());
            assertThat(TransactionSynchronizationManager.isActualTransactionActive()).isTrue();
        });
    }

    private Shorts newShorts() {
        return shortsRepository.saveAndFlush(Shorts.builder().youtubeId("test%07d".formatted(IDS.incrementAndGet()))
                .title("계란밥").channelName("테스트").build());
    }

    private void assertExternalBoundary() {
        assertThat(TransactionSynchronizationManager.isActualTransactionActive()).isFalse();
        assertThat(((HikariDataSource) dataSource).getHikariPoolMXBean().getActiveConnections()).isZero();
    }

    private void awaitFollowers(int expected) throws InterruptedException {
        long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(5);
        while (System.nanoTime() < deadline) {
            long waiting = Thread.getAllStackTraces().values().stream().filter(stack -> Arrays.stream(stack)
                    .anyMatch(frame -> frame.getClassName().equals(AiRecipeService.class.getName())
                            && frame.getMethodName().equals("awaitResult"))).count();
            if (waiting >= expected) return;
            Thread.sleep(10);
        }
        fail("동일 쇼츠 결과를 기다리는 요청 " + expected + "개가 등록되지 않았습니다.");
    }
}
