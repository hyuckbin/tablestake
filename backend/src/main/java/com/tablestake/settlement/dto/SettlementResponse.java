package com.tablestake.settlement.dto;

import java.util.List;

public record SettlementResponse(
        Long id,
        Long offeringId,
        String storeName,
        String offeringTitle,
        String month,
        long baseRevenue,
        double sharePercent,
        long grossAmount,
        long remainingCapBefore,
        long paidAmount,
        long platformFee,
        long investorAmount,
        boolean capReached,
        long totalPaidAfter,
        long repaymentCap,
        String offeringStatus,
        String offeringStatusLabel,
        boolean anomalyOverridden,
        int payoutCount,
        long payoutSum,
        List<PayoutLineResponse> payouts) {
}
