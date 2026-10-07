package com.honbab.diary.domain.account;

import com.honbab.diary.global.config.SecurityConfig;
import com.honbab.diary.global.jwt.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.jpa.mapping.JpaMetamodelMappingContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.http.MediaType;
import java.util.List;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static com.honbab.diary.domain.account.AccountContentDtos.*;

@WebMvcTest(AccountContentController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class})
class AccountContentSecurityTest {
    @Autowired MockMvc mvc;
    @MockBean AccountContentService service;
    @MockBean JwtTokenProvider jwtTokenProvider;
    @MockBean JpaMetamodelMappingContext jpaMappingContext;

    @Test void guestsCannotReadOrWritePrivateData() throws Exception {
        mvc.perform(get("/api/v1/diaries")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/cart/ingredients")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/v1/diaries").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isUnauthorized());
        mvc.perform(delete("/api/v1/diaries/some-id")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/v1/cart/ingredients").contentType(MediaType.APPLICATION_JSON).content("[]"))
                .andExpect(status().isUnauthorized());
        verifyNoInteractions(service);
    }
    private void token() {
        when(jwtTokenProvider.validateToken("token")).thenReturn(true);
        when(jwtTokenProvider.getUserId("token")).thenReturn(42L);
        when(jwtTokenProvider.getEmail("token")).thenReturn("owner@example.com");
    }
    @Test void ownershipComesFromJwtAndPrivateResponsesAreNotCached() throws Exception {
        token();
        when(service.snapshot(42L)).thenReturn(new DiarySnapshot(List.of(), 0, null, 0, 0));
        when(service.cart(42L)).thenReturn(List.of());
        mvc.perform(get("/api/v1/diaries?userId=99").header("Authorization", "Bearer token"))
                .andExpect(status().isOk()).andExpect(header().string("Cache-Control", "no-store"));
        mvc.perform(get("/api/v1/cart/ingredients?userId=99").header("Authorization", "Bearer token"))
                .andExpect(status().isOk());
        verify(service).snapshot(42L);
        verify(service).cart(42L);
        verifyNoMoreInteractions(service);
    }
    @Test void invalidDiaryDoesNotReachService() throws Exception {
        token();
        mvc.perform(post("/api/v1/diaries").header("Authorization", "Bearer token")
                .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(service);
    }
    @Test void invalidCartItemDoesNotReachService() throws Exception {
        token();
        mvc.perform(post("/api/v1/cart/ingredients").header("Authorization", "Bearer token")
                .contentType(MediaType.APPLICATION_JSON).content("[{\"quantity\":0}]"))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(service);
    }
}
