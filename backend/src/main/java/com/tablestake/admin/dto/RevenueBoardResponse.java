package com.tablestake.admin.dto;

import com.tablestake.store.dto.AlertResponse;
import com.tablestake.store.dto.FundingLimitResponse;
import com.tablestake.store.dto.RevenueRowResponse;
import com.tablestake.store.dto.RiskResponse;
import com.tablestake.store.dto.StoreInfoResponse;
import com.tablestake.store.dto.VerificationResponse;

import java.util.List;

/**
 * 운영 콘솔의 가게별 매출 화면.
 *
 * @param fundingLimit           가장 최근 상품 조건으로 계산한 모집 한도(상품이 없으면 null)
 * @param nextMonth              다음에 입력할 월
 * @param nextMonthRegistrable   다음 월이 마감되어 지금 입력할 수 있는지
 * @param lastClosedMonth        매출이 확정된 마지막 달(지난달)
 * @param medianRevenue          최근 12개월 신고 매출 중앙값(시나리오 입력값 계산용)
 * @param baselineCardRatioPercent 최근 12개월 평균 카드 결제 비중
 */
public record RevenueBoardResponse(StoreInfoResponse store, RiskResponse risk, VerificationResponse verification,
                                   List<AlertResponse> storeAlerts, FundingLimitResponse fundingLimit,
                                   List<RevenueRowResponse> rows, String nextMonth, boolean nextMonthRegistrable,
                                   String lastClosedMonth, long medianRevenue,
                                   double baselineCardRatioPercent, List<OfferingBriefResponse> offerings) {
}
