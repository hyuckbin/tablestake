package com.tablestake.store.dto;

import com.tablestake.anomaly.RevenueAlert;

public record AlertResponse(String month, String type, String title, String severity, String severityLabel,
                            String message, String metric) {

    public static AlertResponse from(RevenueAlert alert) {
        return new AlertResponse(
                alert.month().toString(),
                alert.type().name(),
                alert.type().getTitle(),
                alert.severity().name(),
                alert.severity().getLabel(),
                alert.message(),
                alert.metric());
    }
}
