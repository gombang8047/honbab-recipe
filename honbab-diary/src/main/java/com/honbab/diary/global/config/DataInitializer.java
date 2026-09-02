package com.honbab.diary.global.config;

import com.honbab.diary.domain.recipe.entity.Ingredient;
import com.honbab.diary.domain.recipe.entity.Recipe;
import com.honbab.diary.domain.recipe.entity.RecipeIngredient;
import com.honbab.diary.domain.recipe.entity.RecipeStep;
import com.honbab.diary.domain.recipe.repository.IngredientRepository;
import com.honbab.diary.domain.recipe.repository.RecipeRepository;
import com.honbab.diary.domain.shorts.entity.Shorts;
import com.honbab.diary.domain.shorts.repository.ShortsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final ShortsRepository shortsRepository;
    private final RecipeRepository recipeRepository;
    private final IngredientRepository ingredientRepository;

    @Override
    public void run(String... args) throws Exception {
        if (shortsRepository.count() > 0) {
            log.info("DataInitializer: Shorts data already exists. Skipping initialization.");
            return;
        }

        log.info("DataInitializer: Initializing sample Shorts & Recipe data...");

        // 1. Create Shorts
        Shorts s1 = Shorts.builder()
                .youtubeId("mock_shorts_01")
                .title("5분컷 초간단 계란볶음밥 레시피! 자취생 필수 시청 🍳")
                .channelName("자취요리왕")
                .thumbnailUrl("https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&q=80")
                .videoUrl("https://www.youtube.com/shorts/mock_shorts_01")
                .durationSeconds(45)
                .viewCount(125000L)
                .build();

        Shorts s2 = Shorts.builder()
                .youtubeId("mock_shorts_02")
                .title("원팬으로 끝내는 삼겹살 김치볶음밥 레시피 🔥")
                .channelName("혼밥레시피")
                .thumbnailUrl("https://images.unsplash.com/photo-1596560548464-f010549b84d7?w=600&q=80")
                .videoUrl("https://www.youtube.com/shorts/mock_shorts_02")
                .durationSeconds(58)
                .viewCount(89000L)
                .build();

        Shorts s3 = Shorts.builder()
                .youtubeId("mock_shorts_03")
                .title("전자레인지 3분 완성! 폭신폭신 계란찜 🍲")
                .channelName("초간단식당")
                .thumbnailUrl("https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80")
                .videoUrl("https://www.youtube.com/shorts/mock_shorts_03")
                .durationSeconds(30)
                .viewCount(230000L)
                .build();

        Shorts s4 = Shorts.builder()
                .youtubeId("mock_shorts_04")
                .title("남은 참치통조림으로 만드는 참치마요 덮밥 🍣")
                .channelName("자취생일기")
                .thumbnailUrl("https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&q=80")
                .videoUrl("https://www.youtube.com/shorts/mock_shorts_04")
                .durationSeconds(50)
                .viewCount(67000L)
                .build();

        shortsRepository.saveAll(List.of(s1, s2, s3, s4));

        // 2. Ingredients
        Ingredient iRice = ingredientRepository.save(Ingredient.builder().name("밥").category("곡류").storageType(Ingredient.StorageType.ROOM_TEMP).build());
        Ingredient iEgg = ingredientRepository.save(Ingredient.builder().name("계란").category("축산").storageType(Ingredient.StorageType.REFRIGERATED).build());
        Ingredient iGreenOnion = ingredientRepository.save(Ingredient.builder().name("대파").category("채소").storageType(Ingredient.StorageType.REFRIGERATED).build());
        Ingredient iOysterSauce = ingredientRepository.save(Ingredient.builder().name("굴소스").category("양념").storageType(Ingredient.StorageType.REFRIGERATED).build());
        Ingredient iOil = ingredientRepository.save(Ingredient.builder().name("식용유").category("양념").storageType(Ingredient.StorageType.ROOM_TEMP).build());
        Ingredient iKimchi = ingredientRepository.save(Ingredient.builder().name("김치").category("반찬").storageType(Ingredient.StorageType.REFRIGERATED).build());
        Ingredient iPork = ingredientRepository.save(Ingredient.builder().name("삼겹살").category("육류").storageType(Ingredient.StorageType.REFRIGERATED).build());

        // 3. Recipe 1
        Recipe r1 = Recipe.builder()
                .shorts(s1)
                .title("🍳 5분컷 초간단 계란볶음밥")
                .description("파기름과 굴소스로 맛을 낸 1인분 맞춤 계란 볶음밥 레시피입니다.")
                .servingSize(1)
                .prepTimeMinutes(3)
                .cookTimeMinutes(5)
                .difficulty(Recipe.Difficulty.EASY)
                .estimatedCost(3500)
                .build();

        r1.addIngredient(RecipeIngredient.builder().recipe(r1).ingredient(iRice).amount("1").unit("공기").isEssential(true).build());
        r1.addIngredient(RecipeIngredient.builder().recipe(r1).ingredient(iEgg).amount("2").unit("개").isEssential(true).build());
        r1.addIngredient(RecipeIngredient.builder().recipe(r1).ingredient(iGreenOnion).amount("1/2").unit("대").isEssential(true).build());
        r1.addIngredient(RecipeIngredient.builder().recipe(r1).ingredient(iOysterSauce).amount("1").unit("큰술").isEssential(false).build());
        r1.addIngredient(RecipeIngredient.builder().recipe(r1).ingredient(iOil).amount("2").unit("큰술").isEssential(true).build());

        r1.addStep(RecipeStep.builder().recipe(r1).stepOrder(1).description("대파를 송송 썰어 식용유를 두른 팬에 넣고 파기름을 냅니다.").timerSeconds(60).build());
        r1.addStep(RecipeStep.builder().recipe(r1).stepOrder(2).description("파를 한쪽으로 밀고 계란 2개를 풀어 노릇하게 스크램블을 만듭니다.").timerSeconds(60).build());
        r1.addStep(RecipeStep.builder().recipe(r1).stepOrder(3).description("밥 1공기와 굴소스 1큰술을 넣고 센 불에서 골고루 볶아줍니다.").timerSeconds(120).build());
        r1.addStep(RecipeStep.builder().recipe(r1).stepOrder(4).description("불을 끄고 참기름 살짝 두르면 고소한 계란볶음밥 완성!").timerSeconds(0).build());

        recipeRepository.save(r1);

        // 4. Recipe 2
        Recipe r2 = Recipe.builder()
                .shorts(s2)
                .title("🔥 원팬 삼겹살 김치볶음밥")
                .description("노릇하게 구운 삼겹살과 잘 익은 신김치가 어우러진 최고의 원팬 김치볶음밥입니다.")
                .servingSize(1)
                .prepTimeMinutes(5)
                .cookTimeMinutes(8)
                .difficulty(Recipe.Difficulty.EASY)
                .estimatedCost(5500)
                .build();

        r2.addIngredient(RecipeIngredient.builder().recipe(r2).ingredient(iPork).amount("100").unit("g").isEssential(true).build());
        r2.addIngredient(RecipeIngredient.builder().recipe(r2).ingredient(iKimchi).amount("1").unit("컵").isEssential(true).build());
        r2.addIngredient(RecipeIngredient.builder().recipe(r2).ingredient(iRice).amount("1").unit("공기").isEssential(true).build());
        r2.addIngredient(RecipeIngredient.builder().recipe(r2).ingredient(iEgg).amount("1").unit("개").isEssential(false).build());

        r2.addStep(RecipeStep.builder().recipe(r2).stepOrder(1).description("팬에 삼겹살을 한 입 크기로 썰어 바삭하게 볶아 기름을 냅니다.").timerSeconds(180).build());
        r2.addStep(RecipeStep.builder().recipe(r2).stepOrder(2).description("돼지기름에 송송 썰은 신김치와 고춧가루 1스푼을 넣고 달달 볶습니다.").timerSeconds(120).build());
        r2.addStep(RecipeStep.builder().recipe(r2).stepOrder(3).description("밥을 넣고 양념이 잘 배도록 강불에서 골고루 볶아준 뒤 계란후라이를 올려 마무리합니다.").timerSeconds(120).build());

        recipeRepository.save(r2);

        log.info("DataInitializer: Initial sample data seeding complete!");
    }
}
