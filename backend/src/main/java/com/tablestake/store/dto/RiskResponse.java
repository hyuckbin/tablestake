package com.tablestake.store.dto;

import java.util.List;

public record RiskResponse(String grade, String gradeLabel, List<String> reasons) {
}
