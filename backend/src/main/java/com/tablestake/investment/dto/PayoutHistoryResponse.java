package com.tablestake.investment.dto;

public record PayoutHistoryResponse(Long settlementId, Long offeringId, String month, String storeName,
                                    String imageKey, long amount) {

    public PayoutHistoryResponse plus(long more) {
        return new PayoutHistoryResponse(settlementId, offeringId, month, storeName, imageKey, amount + more);
    }
}
