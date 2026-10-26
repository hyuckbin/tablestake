package com.tablestake.anomaly;

import java.time.YearMonth;

public record RevenueAlert(YearMonth month, AlertType type, Severity severity, String message, String metric) {
}
