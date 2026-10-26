package com.tablestake.offering;

public enum OfferingStatus {
    REVIEW("심사 중"),
    RECRUITING("모집 중"),
    FUNDED("모집 완료"),
    ACTIVE("지급 중"),
    COMPLETED("지급 완료");

    private final String label;

    OfferingStatus(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
