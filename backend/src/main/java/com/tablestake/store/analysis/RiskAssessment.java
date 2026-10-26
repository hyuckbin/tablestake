package com.tablestake.store.analysis;

import java.util.List;

public record RiskAssessment(String grade, List<String> reasons) {

    public String gradeLabel() {
        return switch (grade) {
            case "A" -> "안정";
            case "B" -> "보통";
            default -> "주의";
        };
    }
}
