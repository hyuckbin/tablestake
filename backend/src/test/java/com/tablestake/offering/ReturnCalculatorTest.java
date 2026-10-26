package com.tablestake.offering;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ReturnCalculatorTest {

    @Test
    @DisplayName("월 50만 원씩 60개월에 상한 1.3배를 채우면 연 11.4%")
    void capOnePointThree() {
        Projection projection = ReturnCalculator.project(23_000_000L, 500_000L, new BigDecimal("1.30"), 60);

        assertEquals(29_900_000L, projection.capAmount());
        assertEquals(60, projection.expectedMonths());
        assertEquals(29_900_000L, projection.expectedTotal());
        assertEquals(11.4, projection.annualReturnPercent(), 0.05);
        assertTrue(projection.reachesCapWithinTerm());
    }

    @Test
    @DisplayName("상한 배수가 높을수록 연 수익률(음식점의 자금 비용)이 올라간다")
    void higherCapMeansHigherReturn() {
        assertEquals(7.7, ReturnCalculator.project(25_000_000L, 500_000L, new BigDecimal("1.20"), 60)
                .annualReturnPercent(), 0.05);
        assertEquals(18.7, ReturnCalculator.project(20_000_000L, 500_000L, new BigDecimal("1.50"), 60)
                .annualReturnPercent(), 0.05);
    }

    @Test
    @DisplayName("기간 안에 상한을 못 채우면 기간 동안 받은 만큼만 받는다")
    void stopsAtMaturity() {
        Projection projection = ReturnCalculator.project(100_000L, 1_000L, new BigDecimal("1.30"), 60);

        assertFalse(projection.reachesCapWithinTerm());
        assertEquals(60_000L, projection.expectedTotal());
        assertTrue(projection.annualReturnPercent() < 0);
    }
}
