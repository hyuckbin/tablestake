package com.tablestake.offering.dto;

public record SimulationResponse(long amount, ProjectionResponse projection, long remainingAmount,
                                 long myInvestedAmount, long perInvestorLimit, long maxInvestableAmount) {
}
