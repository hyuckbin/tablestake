package com.tablestake.investment.dto;

import java.util.List;

/**
 * @param outstandingPrincipal 아직 돌려받지 못한 원금(투자 원금 - 누적 수령액, 0 미만이면 0)
 * @param realizedProfit       원금보다 더 받은 금액
 */
public record PortfolioResponse(String nickname, long totalInvested, long totalReceived, long outstandingPrincipal,
                                long realizedProfit, List<HoldingResponse> holdings,
                                List<PayoutHistoryResponse> recentPayouts) {
}
