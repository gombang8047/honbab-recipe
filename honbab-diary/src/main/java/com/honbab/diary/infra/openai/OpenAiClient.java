package com.honbab.diary.infra.openai;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class OpenAiClient {

    @Value("${openai.api-key:MOCK_KEY}")
    private String apiKey;

    public String chat(String prompt) {
        if ("MOCK_KEY".equals(apiKey) || apiKey.isBlank()) {
            log.info("[MOCK] OpenAI API Key 미설정으로 스텁 응답을 반환합니다.");
            return getMockGptResponse();
        }
        // 실제 API 연동 로직
        return getMockGptResponse();
    }

    private String getMockGptResponse() {
        return """
        {
          "title": "계란 볶음밥",
          "description": "5분 안에 만드는 고소하고 맛있는 1인분 계란 볶음밥",
          "serving_size": 1,
          "prep_time_minutes": 5,
          "cook_time_minutes": 5,
          "difficulty": "EASY",
          "estimated_cost": 3000,
          "ingredients": [
            { "name": "밥", "amount": "1", "unit": "공기", "is_essential": true },
            { "name": "계란", "amount": "2", "unit": "개", "is_essential": true },
            { "name": "대파", "amount": "1/2", "unit": "대", "is_essential": true },
            { "name": "굴소스", "amount": "1", "unit": "큰술", "is_essential": false }
          ],
          "steps": [
            { "order": 1, "description": "대파를 송송 썰어 식용유를 두른 팬에 파기름을 냅니다.", "timer_seconds": 60 },
            { "order": 2, "description": "계란 2개를 풀어 스크램블을 만듭니다.", "timer_seconds": 60 },
            { "order": 3, "description": "밥과 굴소스를 넣고 강불에서 잘 볶아줍니다.", "timer_seconds": 120 }
          ]
        }
        """;
    }
}
