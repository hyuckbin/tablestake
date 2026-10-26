package com.tablestake.anomaly;

public enum AlertType {
    CARD_EXCEEDS_REPORTED("카드 매출이 신고 매출보다 많음"),
    CARD_RATIO_DROP("카드 결제 비중 급감"),
    REVENUE_SPIKE("매출 급등"),
    REVENUE_DROP("매출 급감"),
    RECENT_SURGE("최근 3개월 매출 급등");

    private final String title;

    AlertType(String title) {
        this.title = title;
    }

    public String getTitle() {
        return title;
    }
}
