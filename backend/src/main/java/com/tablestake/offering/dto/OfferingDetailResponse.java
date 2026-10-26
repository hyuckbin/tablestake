package com.tablestake.offering.dto;

import com.tablestake.store.dto.FundingLimitResponse;
import com.tablestake.store.dto.RevenueRowResponse;
import com.tablestake.store.dto.RiskResponse;
import com.tablestake.store.dto.StoreInfoResponse;
import com.tablestake.store.dto.VerificationResponse;

import java.util.List;

/**
 * @param settlements 최근 정산 기록(최신 달부터)
 */
public record OfferingDetailResponse(
        OfferingSummaryResponse summary,
        String purpose,
        StoreInfoResponse store,
        long totalPaid,
        long repaymentCap,
        long remainingAmount,
        ProjectionResponse projection,
        FundingLimitResponse fundingLimit,
        RiskResponse risk,
        VerificationResponse verification,
        List<RevenueRowResponse> revenues,
        long myInvestedAmount,
        long perInvestorLimit,
        double settlementFeePercent,
        double investorCapMultiple,
        String investorPerk,
        List<SettlementRecordResponse> settlements) {
}
