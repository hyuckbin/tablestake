package com.tablestake.store.dto;

public record StoreInfoResponse(Long id, String name, String region, String regionLabel, String city, String area,
                                String category, String description, String businessType, String openedOn,
                                int operatingMonths, String currency, String imageKey) {
}
