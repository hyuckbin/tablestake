package com.tablestake.anomaly;

public enum Severity {
    HIGH("경고"),
    MEDIUM("주의");

    private final String label;

    Severity(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
