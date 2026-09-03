package com.honbab.diary.domain.user.service;

import com.honbab.diary.domain.user.entity.User;
import com.honbab.diary.domain.user.repository.UserRepository;
import com.honbab.diary.global.exception.BusinessException;
import com.honbab.diary.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;

    public User findById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
    }

    public User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
    }

    @Transactional
    public User findOrCreateByOAuth(String oauthProvider, String oauthId,
                                     String email, String nickname, String profileImageUrl) {
        return userRepository.findByOauthProviderAndOauthId(oauthProvider, oauthId)
                .map(existingUser -> {
                    existingUser.updateProfile(nickname, profileImageUrl);
                    return existingUser;
                })
                .orElseGet(() -> userRepository.save(User.builder()
                        .oauthProvider(oauthProvider)
                        .oauthId(oauthId)
                        .email(email)
                        .nickname(nickname)
                        .profileImageUrl(profileImageUrl)
                        .build()));
    }
}
