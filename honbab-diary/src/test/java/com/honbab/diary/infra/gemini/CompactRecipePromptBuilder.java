package com.honbab.diary.infra.gemini;


import java.util.Collection;

final class CompactRecipePromptBuilder {

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

        sb.append("\n### 생성 규칙\n");
        sb.append("- 최상위 응답은 레시피 1개의 JSON 객체({})입니다. 최상위를 배열([])로 감싸지 마세요. 배열은 ingredients와 steps에만 사용하세요.\n");
        sb.append("- 모든 키를 쌍따옴표로 감싸고 올바른 JSON 문법으로 작성하세요. 공백·줄바꿈은 허용하며 출력 압축을 위해 문법이나 내용을 생략하지 마세요.\n");
        sb.append("- 명시된 재료·분량·단위는 원본 그대로 유지하세요. 용량이 없는 부재료만 일반적인 1인분 적정량을 추정하세요.\n");
        sb.append("- 모든 재료와 조리 행동을 빠짐없이 원래 순서대로 작성하세요. 출력량을 줄이기 위해 재료나 단계를 생략하지 마세요.\n");
        sb.append("- steps.description은 간결한 행동 문장(~한다)으로 쓰고 팁·주의·사족·이모지를 넣지 마세요.\n");
        sb.append("- timer_seconds는 해당 단계에서 기다리는 시간(초)이며 대기가 없으면 0입니다.\n");
        sb.append("- difficulty는 EASY/MEDIUM/HARD, estimated_cost는 원화(KRW) 기준 합리적 추정값입니다.\n");
        sb.append("- 모든 재료·단계에 evidence_source와 evidence_timestamp_seconds를 포함하세요. source는 VIDEO_AUDIO/VIDEO_TEXT/VIDEO_VISUAL/DESCRIPTION/COMMENT/ESTIMATED 중 하나입니다. 영상 근거의 시작 시각(초)을 쓰고 영상 근거가 없거나 시각이 불명확하면 null로 지정하세요. 추정은 ESTIMATED로 표시하세요.\n");
        sb.append("- 아래 키만 사용하세요. 재료별 estimated_price는 생성하지 마세요. amount는 문자열, 나머지 수치 필드는 숫자, is_essential은 boolean입니다.\n");
        sb.append("- JSON 외의 설명이나 마크다운 없이 응답하세요.\n\n");
        sb.append("### 응답 형식 (배열 항목은 필요한 만큼 반복)\n");
        sb.append("""
        {"title":"요리명","description":"요리 설명","serving_size":1,"prep_time_minutes":3,"cook_time_minutes":5,"difficulty":"EASY","estimated_cost":3500,
        "ingredients":[{"name":"재료명","amount":"1","unit":"개","is_essential":true,"evidence_source":"VIDEO_TEXT","evidence_timestamp_seconds":4}],
        "steps":[{"order":1,"description":"재료를 넣는다.","timer_seconds":0,"evidence_source":"VIDEO_VISUAL","evidence_timestamp_seconds":8}]}
        """);

        return sb.toString();
    }
}
