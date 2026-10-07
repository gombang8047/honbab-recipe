package com.honbab.diary.domain.account;

import com.honbab.diary.global.common.ApiResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.validation.annotation.Validated;
import java.util.List;
import jakarta.servlet.http.HttpServletResponse;
import static com.honbab.diary.domain.account.AccountContentDtos.*;

@RestController @RequestMapping("/api/v1") @RequiredArgsConstructor @Validated
public class AccountContentController {
    private final AccountContentService service;
    @ModelAttribute
    void preventPrivateCaching(HttpServletResponse response) {
        response.setHeader("Cache-Control", "no-store");
    }
    // Never accept a user ID from path, query or JSON; ownership comes only from verified JWT.
    private Long user(Authentication authentication) { return (Long) authentication.getPrincipal(); }

    @GetMapping("/cart/ingredients")
    public ApiResponse<List<CartView>> cart(Authentication auth) { return ApiResponse.ok(service.cart(user(auth))); }
    @PostMapping("/cart/ingredients")
    public ApiResponse<List<CartView>> addCart(Authentication auth, @RequestBody @Size(max=1000) List<@Valid CartInput> input) {
        return ApiResponse.ok(service.addCart(user(auth), input, false));
    }
    @PostMapping("/cart/ingredients/import")
    public ApiResponse<List<CartView>> importCart(Authentication auth, @RequestBody @Size(max=1000) List<@Valid CartInput> input) {
        return ApiResponse.ok(service.addCart(user(auth), input, true));
    }
    @PatchMapping("/cart/ingredients")
    public ApiResponse<List<CartView>> patchCart(Authentication auth, @Valid @RequestBody CartUpdate input) {
        return ApiResponse.ok(service.patchCart(user(auth), input.id(), new CartPatch(input.checked(), input.quantity())));
    }
    @PostMapping("/cart/ingredients/check")
    public ApiResponse<List<CartView>> checkCart(Authentication auth, @Valid @RequestBody CartCheck input) {
        return ApiResponse.ok(service.checkCart(user(auth), input));
    }
    @PostMapping("/cart/ingredients/remove")
    public ApiResponse<List<CartView>> removeCart(Authentication auth, @Valid @RequestBody CartRemove input) {
        return ApiResponse.ok(service.removeCart(user(auth), input.ids()));
    }
    @DeleteMapping("/cart/ingredients")
    public ApiResponse<List<CartView>> clearCart(Authentication auth) { return ApiResponse.ok(service.removeCart(user(auth), null)); }

    @GetMapping("/diaries")
    public ApiResponse<DiarySnapshot> diaries(Authentication auth) { return ApiResponse.ok(service.snapshot(user(auth))); }
    @PostMapping("/diaries")
    public ApiResponse<DiaryCreated> create(Authentication auth, @Valid @RequestBody DiaryInput input) {
        return ApiResponse.ok(service.createDiary(user(auth), input));
    }
    @PostMapping("/diaries/import")
    public ApiResponse<DiarySnapshot> importDiaries(Authentication auth, @RequestBody @Size(max=20) List<@Valid DiaryInput> input) {
        return ApiResponse.ok(service.importDiaries(user(auth), input));
    }
    @PutMapping("/diaries/{id}/like")
    public ApiResponse<DiarySnapshot> like(Authentication auth, @PathVariable String id, @Valid @RequestBody DiaryLike input) {
        return ApiResponse.ok(service.likeDiary(user(auth), id, input.liked()));
    }
    @DeleteMapping("/diaries/{id}")
    public ApiResponse<DiarySnapshot> delete(Authentication auth, @PathVariable String id) {
        return ApiResponse.ok(service.deleteDiary(user(auth), id));
    }
    @PostMapping("/diaries/sync-recipe")
    public ApiResponse<DiarySnapshot> sync(Authentication auth, @Valid @RequestBody DiarySync input) {
        return ApiResponse.ok(service.syncDiary(user(auth), input));
    }
    @PostMapping("/diaries/login-xp")
    public ApiResponse<LoginAward> loginXp(Authentication auth) { return ApiResponse.ok(service.loginXp(user(auth))); }
}
