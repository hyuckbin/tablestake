package com.tablestake.store.dto;

import java.util.List;

public record RevenueRowResponse(String month, long reportedRevenue, long cardRevenue, double cardRatioPercent,
                                 boolean excludedFromLimit, List<AlertResponse> alerts) {
}
