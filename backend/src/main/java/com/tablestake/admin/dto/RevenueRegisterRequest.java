package com.tablestake.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;

public record RevenueRegisterRequest(
        @NotBlank(message = "월을 입력하세요.")
        @Pattern(regexp = "\\d{4}-\\d{2}", message = "월은 yyyy-MM 형식이어야 합니다.")
        String month,
        @NotNull(message = "신고 매출을 입력하세요.")
        @PositiveOrZero(message = "신고 매출은 0원 이상이어야 합니다.")
        Long reportedRevenue,
        @NotNull(message = "카드 매출을 입력하세요.")
        @PositiveOrZero(message = "카드 매출은 0원 이상이어야 합니다.")
        Long cardRevenue) {
}
