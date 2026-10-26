package com.tablestake.investment.dto;

public record HoldingResponse(Long offeringId, String storeName, String title, String status, String statusLabel,
                              String region, String city, String category, String imageKey,
                              long invested, long received, long capAmount, double repaymentProgressPercent,
                              String investorPerk) {
}
