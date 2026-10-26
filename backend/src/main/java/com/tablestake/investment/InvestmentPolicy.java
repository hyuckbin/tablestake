package com.tablestake.investment;

import com.tablestake.global.error.BusinessException;
import com.tablestake.global.error.ErrorCode;

/**
 * 투자 금액 규칙. 일반투자자 한도(기업당 연 500만 원)를 데모에서도 그대로 적용한다.
 */
public final class InvestmentPolicy {

    public static final long UNIT = 10_000L;
    public static final long MIN_AMOUNT = 10_000L;
    public static final long PER_INVESTOR_LIMIT = 5_000_000L;

    private InvestmentPolicy() {
    }

    public static void validateAmount(long amount) {
        if (amount < MIN_AMOUNT || amount % UNIT != 0) {
            throw new BusinessException(ErrorCode.INVALID_INVESTMENT_AMOUNT, String.format("입력값: %,d원", amount));
        }
    }
}
