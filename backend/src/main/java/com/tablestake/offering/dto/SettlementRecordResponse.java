package com.tablestake.offering.dto;

/**
 * 투자자에게 공개하는 월별 정산 기록. 매출, 가게가 낸 돈, 수수료, 투자자 몫을 원 단위까지 보여 준다.
 */
public record SettlementRecordResponse(String month, long baseRevenue, long paidAmount, long platformFee,
                                       long investorAmount, boolean anomalyOverridden) {
}
