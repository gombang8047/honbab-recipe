package com.honbab.diary.infra.gemini;

import org.springframework.stereotype.Component;

import java.util.Collection;

@Component
public class GeminiPromptBuilder {

    public String buildRecipePrompt(String title, String description, String comments, Collection<String> tags) {
        StringBuilder sb = new StringBuilder();
        sb.append("당신은 1인 가구 및 자취생 요리 전문 AI 셰프입니다.\n");
        sb.append("첨부된 유튜브 영상의 화면, 화면 자막과 음성을 우선 분석하고, 아래 제목·설명·태그·댓글을 보조 자료로 교차 검증하세요.\n");
        sb.append("영상에서 확인 가능한 정보를 근거로 '1인분 조리 레시피'를 아래 JSON 형식으로만 응답하세요. 영상이 첨부되지 않았다면 제공된 텍스트 정보만 사용하세요.\n\n");

        sb.append("### 영상 텍스트 정보\n");
        sb.append("- 영상 제목: ").append(title != null ? title : "제목 없음").append("\n");

        if (description != null && !description.isBlank()) {
            sb.append("- 영상 설명란:\n").append(description).append("\n");
        }

        if (comments != null && !comments.isBlank()) {
            sb.append("- 영상 주요 댓글:\n").append(comments).append("\n");
        }

        if (tags != null && !tags.isEmpty()) {
            sb.append("- 관련 태그: ").append(String.join(", ", tags)).append("\n");
        }

        sb.append("\n### ⭐️ 핵심 준수 규칙 (절대 원칙)\n");
        sb.append("1. [수치 정보 유지]: 영상의 음성·화면 자막 또는 제공된 텍스트에 구체적인 용량(예: 물 650ml, 간장 2스푼, 다진마늘 2스푼, 고추 3개 등)이 명시되어 있다면 임의로 변경하지 말고 원본 수치를 반영하세요.\n");
        sb.append("2. 영상에 구체적인 용량이 언급되지 않은 부재료에 대해서만 일반적인 1인분 적정량으로 기입하세요.\n");
        sb.append("3. 조리 단계(steps)는 팁이나 사족 없이, 순수 행동 지침만을 간결하고 명확한 문장(~한다, ~썬다, ~넣는다, ~볶는다)으로 일목요연하게 작성하세요.\n");
        sb.append("4. 조리 단계(description) 안에 '팁', '주의', '꿀팁', 이모지(💡) 등의 문장을 절대로 넣지 마세요.\n");
        sb.append("5. 각 단계마다 실제로 끓이거나 볶는 등 기다려야 하는 시간을 초 단위(timer_seconds, 예: 30, 60, 300)로 기입하세요. 대기 시간이 필요 없는 단계는 0으로 지정하세요.\n");
        sb.append("6. 난이도(difficulty)는 'EASY', 'MEDIUM', 'HARD' 중 하나를 선택하세요.\n");
        sb.append("7. 예상 식비(estimated_cost)는 원화(KRW) 기준 합리적인 금액으로 추정하세요.\n\n");
        sb.append("8. 각 재료와 조리 단계에 evidence_source와 evidence_timestamp_seconds를 포함하세요. evidence_source는 VIDEO_AUDIO, VIDEO_TEXT, VIDEO_VISUAL, DESCRIPTION, COMMENT, ESTIMATED 중 하나입니다. 영상 근거가 있으면 시작 타임스탬프(초)를 기록하고, 영상이 없거나 정확한 근거가 없으면 null로 지정하세요. 임의 추정은 반드시 ESTIMATED로 표시하세요.\n\n");

        sb.append("### 응답할 JSON 구조 예시\n");
        sb.append("""
        {
          "title": "원팬 알리오올리오 파스타",
          "description": "설거지 걱정 없는 10분 완성 초간단 원팬 파스타",
          "serving_size": 1,
          "prep_time_minutes": 3,
          "cook_time_minutes": 10,
          "difficulty": "EASY",
          "estimated_cost": 3500,
          "ingredients": [
            { "name": "파스타면", "amount": "1", "unit": "인분", "is_essential": true, "estimated_price": 1000, "evidence_source": "VIDEO_TEXT", "evidence_timestamp_seconds": 4 },
            { "name": "물", "amount": "650", "unit": "ml", "is_essential": true, "estimated_price": 0 },
            { "name": "올리브오일", "amount": "4", "unit": "스푼", "is_essential": true, "estimated_price": 500 },
            { "name": "다진마늘", "amount": "2", "unit": "스푼", "is_essential": true, "estimated_price": 400 },
            { "name": "베트남고추", "amount": "3", "unit": "개", "is_essential": true, "estimated_price": 300 },
            { "name": "참치액", "amount": "1", "unit": "스푼", "is_essential": true, "estimated_price": 200 },
            { "name": "굴소스", "amount": "1", "unit": "스푼", "is_essential": true, "estimated_price": 200 }
          ],
          "steps": [
            { "order": 1, "description": "팬에 올리브오일 4스푼을 두른다.", "timer_seconds": 0, "evidence_source": "VIDEO_VISUAL", "evidence_timestamp_seconds": 8 },
            { "order": 2, "description": "다진마늘 2스푼을 넣고 볶는다.", "timer_seconds": 60 },
            { "order": 3, "description": "베트남고추 3개를 부숴 넣는다.", "timer_seconds": 30 },
            { "order": 4, "description": "파스타면과 물 650ml를 넣는다.", "timer_seconds": 0 },
            { "order": 5, "description": "참치액 1스푼과 굴소스 1스푼을 넣는다.", "timer_seconds": 0 },
            { "order": 6, "description": "끓이면서 소스가 자작하게 졸아들도록 볶는다.", "timer_seconds": 300 }
          ]
        }
        """);

        return sb.toString();
    }
}
