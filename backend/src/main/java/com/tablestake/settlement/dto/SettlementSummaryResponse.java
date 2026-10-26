package com.tablestake.settlement.dto;

public record SettlementSummaryResponse(Long id, String month, long baseRevenue, long grossAmount, long paidAmount,
                                        long platformFee, boolean capReached, boolean anomalyOverridden) {
}
