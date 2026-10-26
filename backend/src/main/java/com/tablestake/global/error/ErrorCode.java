package com.tablestake.global.error;

import org.springframework.http.HttpStatus;

public enum ErrorCode {

    INVALID_REQUEST(HttpStatus.BAD_REQUEST, "요청 값이 올바르지 않습니다."),
    INVALID_MONTH(HttpStatus.BAD_REQUEST, "월은 yyyy-MM 형식으로 입력해야 합니다."),
    INVALID_INVESTMENT_AMOUNT(HttpStatus.BAD_REQUEST, "투자 금액은 1만 원 이상, 1만 원 단위여야 합니다."),
    REVENUE_MONTH_NOT_CLOSED(HttpStatus.BAD_REQUEST, "아직 마감되지 않은 달의 매출은 등록할 수 없습니다."),

    STORE_NOT_FOUND(HttpStatus.NOT_FOUND, "가게를 찾을 수 없습니다."),
    OFFERING_NOT_FOUND(HttpStatus.NOT_FOUND, "투자상품을 찾을 수 없습니다."),
    SETTLEMENT_NOT_FOUND(HttpStatus.NOT_FOUND, "정산 내역을 찾을 수 없습니다."),
    RESOURCE_NOT_FOUND(HttpStatus.NOT_FOUND, "요청한 주소를 찾을 수 없습니다."),
    METHOD_NOT_ALLOWED(HttpStatus.METHOD_NOT_ALLOWED, "지원하지 않는 요청 방식입니다."),

    OFFERING_NOT_RECRUITING(HttpStatus.CONFLICT, "지금 모집 중인 상품이 아닙니다."),
    EXCEEDS_REMAINING_AMOUNT(HttpStatus.CONFLICT, "남은 모집 금액보다 많이 투자할 수 없습니다."),
    INVESTOR_LIMIT_EXCEEDED(HttpStatus.CONFLICT, "한 상품에는 1인당 500만 원까지 투자할 수 있습니다."),
    REVENUE_ALREADY_EXISTS(HttpStatus.CONFLICT, "이미 등록된 월의 매출입니다."),
    REVENUE_OUT_OF_ORDER(HttpStatus.CONFLICT, "매출은 마지막으로 등록한 달의 다음 달부터 순서대로 등록해야 합니다."),
    REVENUE_NOT_FOUND(HttpStatus.CONFLICT, "정산할 월의 매출 데이터가 없습니다."),
    OFFERING_NOT_ACTIVE(HttpStatus.CONFLICT, "지급 중인 상품만 정산할 수 있습니다."),
    ALREADY_SETTLED(HttpStatus.CONFLICT, "이미 정산한 월입니다."),
    SETTLEMENT_OUT_OF_ORDER(HttpStatus.CONFLICT, "정산은 지급 시작 월부터 한 달씩 순서대로 해야 합니다."),
    SETTLEMENT_ON_HOLD(HttpStatus.CONFLICT, "매출 이상 탐지로 정산이 보류되었습니다. 내용을 확인한 뒤 다시 실행하세요."),
    DATA_CONFLICT(HttpStatus.CONFLICT, "같은 데이터가 이미 있어 처리하지 못했습니다."),

    DEMO_INVESTOR_NOT_FOUND(HttpStatus.INTERNAL_SERVER_ERROR, "데모 투자자가 없습니다. 데모 데이터를 초기화하세요."),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "서버 오류가 발생했습니다.");

    private final HttpStatus status;
    private final String message;

    ErrorCode(HttpStatus status, String message) {
        this.status = status;
        this.message = message;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getMessage() {
        return message;
    }
}
