package com.honbab.diary.infra.openai;

import org.springframework.stereotype.Component;

@Component
public class GptPromptBuilder {

    public String buildRecipePrompt(String transcript, String title) {
        return String.format("""
                당신은 자취생 전문 요리 레시피 분석가입니다.
                아래 영상 제목과 자막 스크립트를 분석하여 1인분 기준의 JSON 형식 레시피를 생성하세요.
                
                영상 제목: %s
                자막: %s
                """, title, transcript);
    }
}
