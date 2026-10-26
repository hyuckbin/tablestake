package com.tablestake.store;

import com.tablestake.store.analysis.FundingLimit;
import com.tablestake.store.analysis.FundingLimitCalculator;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;

class FundingLimitCalculatorTest {

    private final FundingLimitCalculator calculator = new FundingLimitCalculator();

    @Test
    @DisplayName("모집 한도 = 평균 매출 × 5% × 60개월 ÷ 1.3배 (1만 원 단위 내림)")
    void formula() {
        List<RevenuePoint> points = new ArrayList<>();
        for (int i = 0; i < 12; i++) {
            points.add(new RevenuePoint(YearMonth.of(2025, 1).plusMonths(i), 10_000_000L, 9_000_000L));
        }

        FundingLimit limit = calculator.calculate(points, Set.of(), new BigDecimal("0.05"), 60, new BigDecimal("1.30"));

        assertEquals(10_000_000L, limit.averageRevenueClean());
        assertEquals(23_070_000L, limit.limitClean());
    }

    @Test
    @DisplayName("이상 탐지된 달은 평균에서 빼서 한도를 계산한다")
    void excludesFlaggedMonths() {
        List<RevenuePoint> points = new ArrayList<>();
        for (int i = 0; i < 12; i++) {
            long revenue = i >= 9 ? 15_000_000L : 10_000_000L;
            points.add(new RevenuePoint(YearMonth.of(2025, 1).plusMonths(i), revenue, revenue * 9 / 10));
        }
        Set<YearMonth> excluded = Set.of(YearMonth.of(2025, 10), YearMonth.of(2025, 11), YearMonth.of(2025, 12));

        FundingLimit limit = calculator.calculate(points, excluded, new BigDecimal("0.05"), 60, new BigDecimal("1.30"));

        assertEquals(11_250_000L, limit.averageRevenueAll());
        assertEquals(10_000_000L, limit.averageRevenueClean());
        assertEquals(3, limit.excludedMonths().size());
        assertEquals(9, limit.basisMonths());
    }
}
