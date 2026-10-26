package com.tablestake.store.analysis;

public enum VerificationStatus {
    NORMAL("정상"),
    CAUTION("주의"),
    WARNING("경고");

    private final String label;

    VerificationStatus(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
