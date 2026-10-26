package com.tablestake.offering.dto;

import java.util.List;

/**
 * 투자자 앱 목록(홈·마켓·공모)에 쓰는 상품 요약.
 *
 * @param investorCapMultiple   투자자가 받는 최대 배수 = 상환 배수 × (1 − 정산 수수료)
 * @param totalPaid             가게가 지금까지 낸 돈(수수료 떼기 전)
 * @param monthlyPayout         최근 평균 매출 기준, 상품 전체가 매달 투자자에게 주는 돈(수수료 뺀 금액)
 * @param holdMonth             다음 정산 달에 이상 매출 경고가 있어 정산이 보류된 달. 없으면 null
 * @param averageMonthlyRevenue 이상 달을 뺀 최근 12개월 평균 신고 매출
 * @param revenueGrowthPercent  최근 3개월 매출의 1년 전 같은 기간 대비 증감(%)
 * @param revenueTrend          최근 12개월 신고 매출(오래된 달부터)
 */
public record OfferingSummaryResponse(
        Long id,
        Long storeId,
        String storeName,
        String region,
        String regionLabel,
        String city,
        String area,
        String category,
        String imageKey,
        String title,
        String status,
        String statusLabel,
        long targetAmount,
        long raisedAmount,
        double fundingRatePercent,
        long investorCount,
        double revenueSharePercent,
        double capMultiple,
        double investorCapMultiple,
        int maxTermMonths,
        double expectedAnnualReturnPercent,
        String riskGrade,
        String recruitEndsOn,
        double repaymentProgressPercent,
        long totalPaid,
        long monthlyPayout,
        String payoutStartMonth,
        String lastSettledMonth,
        String verificationStatus,
        String verificationStatusLabel,
        int recentAlertCount,
        String holdMonth,
        String holdReason,
        long averageMonthlyRevenue,
        double revenueGrowthPercent,
        List<Long> revenueTrend,
        String investorPerk) {
}
