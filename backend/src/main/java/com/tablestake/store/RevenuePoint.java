package com.tablestake.store;

import java.time.YearMonth;

/**
 * 한 달치 매출 데이터.
 *
 * @param reportedRevenue 신고 매출(지급 기준)
 * @param cardRevenue     카드사 승인 매출(사장님이 바꾸기 어려운 교차 검증용 데이터)
 */
public record RevenuePoint(YearMonth month, long reportedRevenue, long cardRevenue) {

    public double cardRatio() {
        return reportedRevenue == 0 ? 0.0 : (double) cardRevenue / reportedRevenue;
    }
}
