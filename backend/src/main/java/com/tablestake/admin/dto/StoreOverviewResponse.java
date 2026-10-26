package com.tablestake.admin.dto;

import java.util.List;

public record StoreOverviewResponse(Long id, String name, String area, String category, String latestMonth,
                                    long latestReportedRevenue, String verificationStatus,
                                    String verificationStatusLabel, int recentAlertCount, String riskGrade,
                                    List<OfferingBriefResponse> offerings) {
}
