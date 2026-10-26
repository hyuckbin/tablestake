package com.tablestake.offering.dto;

import com.tablestake.offering.Projection;

/**
 * @param basisMonthlyRevenue 예상에 쓴 월 매출(이상 달을 뺀 최근 12개월 평균 신고 매출)
 */
public record ProjectionResponse(long monthlyPayout, int expectedMonths, long expectedTotal, long capAmount,
                                 double annualReturnPercent, boolean reachesCapWithinTerm,
                                 long basisMonthlyRevenue) {

    public static ProjectionResponse of(Projection projection, long basisMonthlyRevenue) {
        return new ProjectionResponse(projection.monthlyPayout(), projection.expectedMonths(),
                projection.expectedTotal(), projection.capAmount(), projection.annualReturnPercent(),
                projection.reachesCapWithinTerm(), basisMonthlyRevenue);
    }
}
