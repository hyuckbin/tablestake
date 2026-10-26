package com.tablestake.store.analysis;

import java.time.YearMonth;
import java.util.List;

/**
 * 모집 한도 계산 결과.
 *
 * @param averageRevenueAll   최근 12개월 평균 신고 매출(모든 달 포함)
 * @param averageRevenueClean 이상 탐지된 달을 뺀 평균 신고 매출
 * @param excludedMonths      평균에서 뺀 달
 * @param limitAll            모든 달 기준 모집 한도
 * @param limitClean          이상 달 제외 기준 모집 한도(실제 적용)
 * @param basisMonths         평균에 쓴 달 수
 */
public record FundingLimit(long averageRevenueAll, long averageRevenueClean, List<YearMonth> excludedMonths,
                           long limitAll, long limitClean, int basisMonths) {
}
