package com.tablestake.store.dto;

import java.util.List;

public record VerificationResponse(String status, String statusLabel, List<AlertResponse> alerts) {
}
