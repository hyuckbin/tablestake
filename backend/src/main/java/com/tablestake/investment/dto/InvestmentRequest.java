package com.tablestake.investment.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record InvestmentRequest(
        @NotNull(message = "투자 금액을 입력하세요.")
        @Min(value = 10_000, message = "투자 금액은 1만 원 이상이어야 합니다.")
        Long amount) {
}
