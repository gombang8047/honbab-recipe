package com.honbab.diary.domain.shorts;

import com.honbab.diary.domain.shorts.controller.ShortsController;
import com.honbab.diary.domain.shorts.service.ShortsService;
import com.honbab.diary.domain.shorts.service.ShortsCrawlingService;
import com.honbab.diary.global.config.SecurityConfig;
import com.honbab.diary.global.jwt.JwtAuthenticationFilter;
import com.honbab.diary.global.jwt.JwtTokenProvider;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.mapping.JpaMetamodelMappingContext;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ShortsController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class})
class BookmarkSecurityTest {
    @Autowired MockMvc mvc;
    @MockBean ShortsService shortsService;
    @MockBean ShortsCrawlingService shortsCrawlingService;
    @MockBean JwtTokenProvider jwtTokenProvider;
    @MockBean JpaMetamodelMappingContext jpaMappingContext;

    @Test
    void guestsCannotReadOrChangeBookmarks() throws Exception {
        mvc.perform(get("/api/v1/shorts/bookmarks")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/v1/shorts/1/bookmark")).andExpect(status().isUnauthorized());
        mvc.perform(delete("/api/v1/shorts/1/bookmark")).andExpect(status().isUnauthorized());
        verifyNoInteractions(shortsService);
    }

    @Test
    void authenticatedBookmarksUseJwtAccount() throws Exception {
        when(jwtTokenProvider.validateToken("valid-token")).thenReturn(true);
        when(jwtTokenProvider.getUserId("valid-token")).thenReturn(42L);
        when(jwtTokenProvider.getEmail("valid-token")).thenReturn("user@example.com");
        when(shortsService.getBookmarks(eq(42L), any())).thenReturn(Page.empty());
        mvc.perform(get("/api/v1/shorts/bookmarks")
                .header("Authorization", "Bearer valid-token")).andExpect(status().isOk());
        verify(shortsService).getBookmarks(eq(42L), any());
    }

    @Test
    void publicFeedStillWorksWithoutLogin() throws Exception {
        when(shortsService.getFeed(any())).thenReturn(Page.empty());
        mvc.perform(get("/api/v1/shorts")).andExpect(status().isOk());
    }
}
