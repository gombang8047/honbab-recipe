package com.honbab.diary.infra.kakao;

import com.honbab.diary.global.exception.BusinessException;
import com.honbab.diary.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class KakaoAuthClient {

    private final RestTemplate restTemplate;

    @Value("${kakao.client-id:205c8310126b67c0479b663e5bfa0745}")
    private String clientId;

    @Value("${kakao.client-secret:YOT6UgzyJs70b2ZXhdl2AmWPTuAVGQ81}")
    private String clientSecret;

    private static final String KAKAO_TOKEN_URL = "https://kauth.kakao.com/oauth/token";
    private static final String KAKAO_USER_INFO_URL = "https://kapi.kakao.com/v2/user/me";

    /**
     * 1단계: 인가 코드로 카카오 액세스 토큰 발급
     */
    @SuppressWarnings("unchecked")
    public String getAccessToken(String authorizationCode, String redirectUri) {
        // 테스트용 Mock 인가 코드 처리
        if (authorizationCode != null && authorizationCode.startsWith("DEV_MOCK")) {
            log.info("[MOCK] 개발용 카카오 인가 코드로 임시 토큰 발급");
            return "mock_kakao_access_token_dev";
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
            params.add("grant_type", "authorization_code");
            params.add("client_id", clientId);
            params.add("redirect_uri", redirectUri);
            params.add("code", authorizationCode);

            if (clientSecret != null && !clientSecret.isBlank() && !"MOCK_KEY".equals(clientSecret)) {
                params.add("client_secret", clientSecret);
            }

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    KAKAO_TOKEN_URL, request, Map.class);

            Map<String, Object> body = response.getBody();
            if (body != null && body.containsKey("access_token")) {
                return (String) body.get("access_token");
            }
        } catch (Exception e) {
            log.error("카카오 토큰 발급 실패 (authCode={}): {}", authorizationCode, e.getMessage());
            throw new BusinessException(ErrorCode.KAKAO_AUTH_FAILED);
        }

        throw new BusinessException(ErrorCode.KAKAO_AUTH_FAILED);
    }

    /**
     * 2단계: 액세스 토큰으로 카카오 사용자 정보 조회
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> getUserInfo(String accessToken) {
        // Mock 토큰인 경우
        if (accessToken != null && accessToken.startsWith("mock_")) {
            log.info("[MOCK] 개발용 사용자 정보 반환");
            return Map.of(
                    "id", 99999999L,
                    "kakao_account", Map.of(
                            "email", "dev_honbab@kakao.com",
                            "profile", Map.of(
                                    "nickname", "테스트혼밥러",
                                    "profile_image_url", "https://k.kakaocdn.net/dn/profile.jpg"
                            )
                    )
            );
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            HttpEntity<Void> request = new HttpEntity<>(headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                    KAKAO_USER_INFO_URL, HttpMethod.GET, request, Map.class);

            Map<String, Object> body = response.getBody();
            if (body != null && body.containsKey("id")) {
                return body;
            }
        } catch (Exception e) {
            log.error("카카오 사용자 정보 조회 실패: {}", e.getMessage());
            throw new BusinessException(ErrorCode.KAKAO_AUTH_FAILED);
        }

        throw new BusinessException(ErrorCode.KAKAO_AUTH_FAILED);
    }
}
