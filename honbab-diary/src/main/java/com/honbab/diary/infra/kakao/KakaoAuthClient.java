package com.honbab.diary.infra.kakao;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Map;

@Slf4j
@Component
public class KakaoAuthClient {

    public String getAccessToken(String authorizationCode, String redirectUri) {
        log.info("[MOCK] Kakao OAuth getAccessToken: authCode={}", authorizationCode);
        return "mock_kakao_access_token_12345";
    }

    public Map<String, Object> getUserInfo(String accessToken) {
        log.info("[MOCK] Kakao OAuth getUserInfo: token={}", accessToken);
        return Map.of(
                "id", 123456789L,
                "kakao_account", Map.of(
                        "email", "user@example.com",
                        "profile", Map.of(
                                "nickname", "혼밥러",
                                "profile_image_url", "https://k.kakaocdn.net/dn/profile.jpg"
                        )
                )
        );
    }
}
