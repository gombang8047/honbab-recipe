package com.honbab.diary.infra.openai;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class WhisperClient {

    @Value("${openai.api-key:MOCK_KEY}")
    private String apiKey;

    public String transcribe(String videoUrl) {
        if ("MOCK_KEY".equals(apiKey) || apiKey.isBlank()) {
            log.info("[MOCK] Whisper STT 미설정으로 스텁 자막 반환. url={}", videoUrl);
            return "안녕하세요 오늘은 5분만에 만드는 고소한 계란 볶음밥 만들어볼게요. 먼저 파기름 내고 계란 두개 톡 깨트려서 스크램블 만들고 밥이랑 굴소스 한큰술 넣어 볶아주면 끝입니다.";
        }
        return "자막 스크립트 텍스트...";
    }
}
