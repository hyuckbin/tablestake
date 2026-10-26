package com.tablestake.store;

public enum BusinessType {
    CORPORATION("법인"),
    SOLE_PROPRIETOR("개인사업자");

    private final String label;

    BusinessType(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
