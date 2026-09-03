package com.honbab.diary.infra.gemini;

import org.springframework.stereotype.Component;

import java.util.Collection;

@Component
public class GeminiPromptBuilder {

    public String buildRecipePrompt(String title, String description, Collection<String> tags) {
        StringBuilder sb = new StringBuilder();
        sb.append("당신은 1인 가구 및 자취생 요리 전문 AI 셰프입니다.\n");
        sb.append("아래 유튜브 요리 쇼츠 영상의 정보를 꼼꼼히 분석하여, 초보자도 한눈에 바로 따라할 수 있는 군더더기 없는 '1인분 조리 레시피'를 아래 JSON 형식으로만 응답하세요.\n\n");

        sb.append("### 영상 정보\n");
        sb.append("- 영상 제목: ").append(title != null ? title : "제목 없음").append("\n");

        if (description != null && !description.isBlank()) {
            sb.append("- 영상 설명란/레시피 텍스트:\n").append(description).append("\n");
        }

        if (tags != null && !tags.isEmpty()) {
            sb.append("- 관련 태그: ").append(String.join(", ", tags)).append("\n");
        }

        sb.append("\n### 반드시 준수할 작성 규칙\n");
        sb.append("1. 분량은 무조건 1인분(serving_size: 1) 기준으로 계산하세요.\n");
        sb.append("2. 재료는 자취생이 마트나 편의점에서 구하기 쉬운 단위(개, 큰술, 공기, 장, g 등)로 정량화하세요.\n");
        sb.append("3. 조리 단계(steps)는 팁이나 사족 없이, 순수 행동 지침만을 간결하고 명확한 문장(~한다, ~썬다, ~넣는다, ~볶는다)으로 일목요연하게 작성하세요.\n");
        sb.append("4. 조리 단계(description) 안에 '팁', '주의', '꿀팁', 이모지(💡) 등의 문장을 절대로 넣지 마세요.\n");
        sb.append("5. 각 단계마다 실제로 불을 쓰거나 기다려야 하는 시간을 초 단위(timer_seconds, 예: 30, 60, 180)로 기입하세요. 대기 시간이 필요 없는 단계는 0으로 지정하세요.\n");
        sb.append("6. 난이도(difficulty)는 'EASY', 'MEDIUM', 'HARD' 중 하나를 선택하세요.\n");
        sb.append("7. 예상 식비(estimated_cost)는 원화(KRW) 기준 합리적인 금액(예: 3000, 4500)으로 추정하세요.\n\n");

        sb.append("### 응답할 JSON 구조 예시\n");
        sb.append("""
        {
          "title": "원팬 햄치즈 계란 토스트",
          "description": "5분 안에 만드는 바삭촉촉 원팬 토스트",
          "serving_size": 1,
          "prep_time_minutes": 3,
          "cook_time_minutes": 5,
          "difficulty": "EASY",
          "estimated_cost": 3500,
          "ingredients": [
            { "name": "식빵", "amount": "2", "unit": "장", "is_essential": true, "estimated_price": 800 },
            { "name": "계란", "amount": "2", "unit": "개", "is_essential": true, "estimated_price": 600 },
            { "name": "슬라이스 햄", "amount": "2", "unit": "장", "is_essential": true, "estimated_price": 800 },
            { "name": "체다치즈", "amount": "1", "unit": "장", "is_essential": false, "estimated_price": 500 },
            { "name": "버터", "amount": "1", "unit": "큰술", "is_essential": true, "estimated_price": 400 }
          ],
          "steps": [
            { "order": 1, "description": "팬을 달구고 버터를 녹인 뒤 계란물을 붓는다.", "timer_seconds": 30 },
            { "order": 2, "description": "식빵을 올리고 앞뒤로 계란을 묻힌 후 뒤집는다.", "timer_seconds": 60 },
            { "order": 3, "description": "치즈와 햄을 올리고 반으로 접어 앞뒤로 노릇하게 굽는다.", "timer_seconds": 90 }
          ]
        }
        """);

        return sb.toString();
    }
}
