package com.tablestake.settlement.dto;

public record PayoutLineResponse(String investorNickname, boolean demoUser, long investmentAmount, long amount) {
}
