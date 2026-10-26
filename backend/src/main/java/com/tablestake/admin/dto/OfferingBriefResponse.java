package com.tablestake.admin.dto;

public record OfferingBriefResponse(Long id, String title, String status, String statusLabel, long targetAmount,
                                    long raisedAmount, String nextSettlementMonth) {
}
