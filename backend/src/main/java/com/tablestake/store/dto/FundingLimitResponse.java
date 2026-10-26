package com.tablestake.store.dto;

import java.util.List;

/**
 * 모집 한도 계산 근거. limitClean이 실제 적용 한도이고, limitAll은 이상 달까지 넣었을 때의 값이다.
 */
public record FundingLimitResponse(long averageRevenueAll, long averageRevenueClean, List<String> excludedMonths,
                                   long limitAll, long limitClean, int basisMonths, double sharePercent,
                                   int termMonths, double capMultiple, long targetAmount,
                                   boolean targetWithinLimit) {
}
