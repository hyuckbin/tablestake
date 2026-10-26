package com.tablestake.investment.dto;

public record InvestmentResponse(Long investmentId, Long offeringId, String storeName, long amount,
                                 long myTotalInOffering, long raisedAmount, long targetAmount,
                                 String offeringStatus, String offeringStatusLabel) {
}
