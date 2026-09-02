package com.honbab.diary.global.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    // Common
    INVALID_INPUT(HttpStatus.BAD_REQUEST, "COMMON_001", "잘못된 입력값입니다."),
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "COMMON_002", "서버 내부 오류가 발생했습니다."),
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "COMMON_003", "인증이 필요합니다."),
    FORBIDDEN(HttpStatus.FORBIDDEN, "COMMON_004", "접근 권한이 없습니다."),

    // Auth
    INVALID_TOKEN(HttpStatus.UNAUTHORIZED, "AUTH_001", "유효하지 않은 토큰입니다."),
    EXPIRED_TOKEN(HttpStatus.UNAUTHORIZED, "AUTH_002", "만료된 토큰입니다."),
    KAKAO_AUTH_FAILED(HttpStatus.BAD_REQUEST, "AUTH_003", "카카오 인증에 실패했습니다."),

    // User
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "USER_001", "사용자를 찾을 수 없습니다."),
    DUPLICATE_USER(HttpStatus.CONFLICT, "USER_002", "이미 존재하는 사용자입니다."),

    // Shorts
    SHORTS_NOT_FOUND(HttpStatus.NOT_FOUND, "SHORTS_001", "해당 쇼츠를 찾을 수 없습니다."),
    SHORTS_CRAWLING_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "SHORTS_002", "쇼츠 크롤링에 실패했습니다."),

    // Recipe
    RECIPE_NOT_FOUND(HttpStatus.NOT_FOUND, "RECIPE_001", "해당 레시피를 찾을 수 없습니다."),
    AI_CONVERSION_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "RECIPE_002", "AI 레시피 변환에 실패했습니다."),
    INGREDIENT_NOT_FOUND(HttpStatus.NOT_FOUND, "RECIPE_003", "해당 재료를 찾을 수 없습니다."),

    // Cart
    CART_NOT_FOUND(HttpStatus.NOT_FOUND, "CART_001", "장바구니를 찾을 수 없습니다."),
    CART_ITEM_NOT_FOUND(HttpStatus.NOT_FOUND, "CART_002", "장바구니 아이템을 찾을 수 없습니다."),
    PRODUCT_MAPPING_NOT_FOUND(HttpStatus.NOT_FOUND, "CART_003", "상품 매핑 정보를 찾을 수 없습니다."),

    // Payment
    PAYMENT_FAILED(HttpStatus.BAD_REQUEST, "PAY_001", "결제에 실패했습니다."),
    PAYMENT_NOT_FOUND(HttpStatus.NOT_FOUND, "PAY_002", "결제 내역을 찾을 수 없습니다."),
    PAYMENT_ALREADY_COMPLETED(HttpStatus.CONFLICT, "PAY_003", "이미 완료된 결제입니다."),
    PAYMENT_CANCEL_FAILED(HttpStatus.BAD_REQUEST, "PAY_004", "결제 취소에 실패했습니다.");

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;
}
