package com.tablestake.admin.dto;

import com.tablestake.store.dto.AlertResponse;
import com.tablestake.store.dto.VerificationResponse;

import java.util.List;

public record RevenueRegisterResponse(String month, long reportedRevenue, long cardRevenue,
                                      double cardRatioPercent, List<AlertResponse> alerts,
                                      VerificationResponse verification) {
}
