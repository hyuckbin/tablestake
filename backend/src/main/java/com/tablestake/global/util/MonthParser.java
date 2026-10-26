package com.tablestake.global.util;

import com.tablestake.global.error.BusinessException;
import com.tablestake.global.error.ErrorCode;

import java.time.YearMonth;
import java.time.format.DateTimeParseException;

public final class MonthParser {

    private MonthParser() {
    }

    public static YearMonth parse(String value) {
        if (value == null || value.isBlank()) {
            throw new BusinessException(ErrorCode.INVALID_MONTH);
        }
        try {
            return YearMonth.parse(value.trim());
        } catch (DateTimeParseException exception) {
            throw new BusinessException(ErrorCode.INVALID_MONTH, "입력값: " + value);
        }
    }
}
