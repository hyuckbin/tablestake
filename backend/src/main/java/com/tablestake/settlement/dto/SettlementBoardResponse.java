package com.tablestake.settlement.dto;

import java.util.List;

/**
 * @param nextSettlementMonth 다음에 정산할 월. 지급 중이 아니면 null.
 * @param storeReceivedAmount 모은 돈에서 모집 수수료를 뺀, 가게가 실제로 받은 돈
 */
public record SettlementBoardResponse(Long offeringId, String title, String storeName, String status,
                                      String statusLabel, double sharePercent, double capMultiple,
                                      long raisedAmount, long repaymentCap, long totalPaid,
                                      double repaymentProgressPercent, String payoutStartMonth,
                                      String nextSettlementMonth, long storeReceivedAmount,
                                      double recruitFeePercent, double settlementFeePercent,
                                      List<SettlementSummaryResponse> settlements) {
}
