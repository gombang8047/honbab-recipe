package com.honbab.diary.domain.auth.service;

import com.honbab.diary.domain.auth.dto.KakaoLoginRequest;
import com.honbab.diary.domain.auth.dto.TokenResponse;
import com.honbab.diary.domain.user.entity.User;
import com.honbab.diary.domain.user.service.UserService;
import com.honbab.diary.global.jwt.JwtTokenProvider;
import com.honbab.diary.infra.kakao.KakaoAuthClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final KakaoAuthClient kakaoAuthClient;
    private final UserService userService;
    private final JwtTokenProvider jwtTokenProvider;
    private final RedisTemplate<String, Object> redisTemplate;

    @Value("${jwt.access-token-validity-ms:3600000}")
    private long accessTokenValidityMs;

    /**
     * 카카오 소셜 로그인
     * 1. 인가 코드로 카카오 액세스 토큰 발급
     * 2. 카카오 사용자 정보 조회
     * 3. 사용자 조회 또는 생성 (회원가입)
     * 4. JWT 토큰 발급
     */
    public TokenResponse kakaoLogin(KakaoLoginRequest request) {
        // 1. 카카오 토큰 발급
        String kakaoAccessToken = kakaoAuthClient.getAccessToken(
                request.getAuthorizationCode(), request.getRedirectUri());

        // 2. 카카오 사용자 정보 조회
        Map<String, Object> userInfo = kakaoAuthClient.getUserInfo(kakaoAccessToken);
        log.info("카카오 getUserInfo 원본 응답: {}", userInfo);

        String oauthId = String.valueOf(userInfo.get("id"));
        @SuppressWarnings("unchecked")
        Map<String, Object> properties = (Map<String, Object>) userInfo.get("properties");
        @SuppressWarnings("unchecked")
        Map<String, Object> kakaoAccount = (Map<String, Object>) userInfo.get("kakao_account");
        @SuppressWarnings("unchecked")
        Map<String, Object> profile = kakaoAccount != null ? (Map<String, Object>) kakaoAccount.get("profile") : null;

        // 이메일 추출
        String email = kakaoAccount != null ? (String) kakaoAccount.get("email") : null;
        if (email == null || email.isBlank()) {
            email = "kakao_" + oauthId + "@honbab.com";
        }

        // 닉네임 추출 (profile -> properties -> 기본값 순서)
        String nickname = null;
        if (profile != null && profile.get("nickname") != null) {
            nickname = (String) profile.get("nickname");
        } else if (properties != null && properties.get("nickname") != null) {
            nickname = (String) properties.get("nickname");
        }
        if (nickname == null || nickname.isBlank()) {
            nickname = "혼밥러_" + (oauthId.length() > 4 ? oauthId.substring(oauthId.length() - 4) : oauthId);
        }

        // 프로필 사진 추출 (profile -> properties 순서)
        String profileImage = null;
        if (profile != null && profile.get("profile_image_url") != null) {
            profileImage = (String) profile.get("profile_image_url");
        } else if (properties != null && properties.get("profile_image") != null) {
            profileImage = (String) properties.get("profile_image");
        }

        // 3. 사용자 생성 또는 조회
        User user = userService.findOrCreateByOAuth("KAKAO", oauthId, email, nickname, profileImage);

        // 4. JWT 발급
        String accessToken = jwtTokenProvider.createAccessToken(user.getId(), user.getEmail());
        String refreshToken = jwtTokenProvider.createRefreshToken(user.getId(), user.getEmail());

        // Refresh Token을 Redis에 저장
        redisTemplate.opsForValue().set(
                "RT:" + user.getId(), refreshToken, 14, TimeUnit.DAYS);

        log.info("카카오 로그인 성공: userId={}, nickname={}, email={}", user.getId(), user.getNickname(), user.getEmail());

        return TokenResponse.of(accessToken, refreshToken, accessTokenValidityMs / 1000,
                user.getId(), user.getNickname(), user.getProfileImageUrl());
    }

    /**
     * 토큰 갱신
     */
    public TokenResponse refreshToken(String refreshToken) {
        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw new com.honbab.diary.global.exception.BusinessException(
                    com.honbab.diary.global.exception.ErrorCode.INVALID_TOKEN);
        }

        Long userId = jwtTokenProvider.getUserId(refreshToken);
        String email = jwtTokenProvider.getEmail(refreshToken);

        // Redis에 저장된 Refresh Token과 비교
        String storedToken = (String) redisTemplate.opsForValue().get("RT:" + userId);
        if (storedToken == null || !storedToken.equals(refreshToken)) {
            throw new com.honbab.diary.global.exception.BusinessException(
                    com.honbab.diary.global.exception.ErrorCode.INVALID_TOKEN);
        }

        String newAccessToken = jwtTokenProvider.createAccessToken(userId, email);
        String newRefreshToken = jwtTokenProvider.createRefreshToken(userId, email);

        redisTemplate.opsForValue().set(
                "RT:" + userId, newRefreshToken, 14, TimeUnit.DAYS);

        return TokenResponse.of(newAccessToken, newRefreshToken, accessTokenValidityMs / 1000);
    }

    /**
     * 로그아웃 — Redis에서 Refresh Token 삭제
     */
    public void logout(Long userId) {
        redisTemplate.delete("RT:" + userId);
        log.info("로그아웃 처리 완료: userId={}", userId);
    }
}
