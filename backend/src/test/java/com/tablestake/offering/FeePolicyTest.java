package com.tablestake.offering;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;

class FeePolicyTest {

    @Test
    @DisplayName("정산 수수료는 2%이고 1원 미만은 버린다")
    void settlementFee() {
        assertEquals(14_382L, FeePolicy.settlementFeeOf(719_100L));
        assertEquals(704_718L, FeePolicy.investorShareOf(719_100L));
        assertEquals(0L, FeePolicy.settlementFeeOf(49L));
        assertEquals(1L, FeePolicy.settlementFeeOf(50L));
    }

    @Test
    @DisplayName("투자자가 받는 최대 배수는 1.3배에서 수수료 2%를 뺀 1.274배다")
    void investorCap() {
        assertEquals(0, new BigDecimal("1.274").compareTo(FeePolicy.investorCapMultiple(new BigDecimal("1.30"))));
    }

    @Test
    @DisplayName("모집 수수료는 모은 돈의 5%다")
    void recruitFee() {
        assertEquals(1_600_000L, FeePolicy.recruitFeeOf(32_000_000L));
    }
}
