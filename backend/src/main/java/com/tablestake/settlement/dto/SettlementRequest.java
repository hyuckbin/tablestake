package com.tablestake.settlement.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * @param anomalyConfirmed 이상 탐지 경고를 운영자가 확인했는지. 경고가 있는데 false면 정산이 보류된다.
 */
public record SettlementRequest(
        @NotBlank(message = "정산할 월을 입력하세요.")
        @Pattern(regexp = "\\d{4}-\\d{2}", message = "월은 yyyy-MM 형식이어야 합니다.")
        String month,
        boolean anomalyConfirmed) {
}
