package com.tablestake.store.analysis;

import com.tablestake.store.RevenuePoint;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.YearMonth;
import java.util.List;
import java.util.Set;

/**
 * 모집 한도 = 평균 월 매출 × 매출 연동 비율 × 계약 개월 수 ÷ 상환 상한 배수.
 * 계약 기간 안에 상환 상한을 채울 수 있는 최대 모집액이다(1만 원 단위 내림).
 */
public class FundingLimitCalculator {

    public FundingLimit calculate(List<RevenuePoint> last12, Set<YearMonth> excludedMonths, BigDecimal shareRate,
                                  int termMonths, BigDecimal capMultiple) {
        long averageAll = averageOf(last12);
        List<RevenuePoint> clean = last12.stream()
                .filter(point -> !excludedMonths.contains(point.month()))
                .toList();
        List<RevenuePoint> basis = clean.isEmpty() ? last12 : clean;
        long averageClean = averageOf(basis);
        List<YearMonth> excluded = last12.stream()
                .map(RevenuePoint::month)
                .filter(excludedMonths::contains)
                .sorted()
                .toList();
        return new FundingLimit(averageAll, averageClean, excluded,
                limitOf(averageAll, shareRate, termMonths, capMultiple),
                limitOf(averageClean, shareRate, termMonths, capMultiple),
                basis.size());
    }

    static long limitOf(long averageRevenue, BigDecimal shareRate, int termMonths, BigDecimal capMultiple) {
        if (capMultiple.signum() <= 0) {
            return 0L;
        }
        long raw = BigDecimal.valueOf(averageRevenue)
                .multiply(shareRate)
                .multiply(BigDecimal.valueOf(termMonths))
                .divide(capMultiple, 0, RoundingMode.DOWN)
                .longValue();
        return raw / 10_000L * 10_000L;
    }

    private static long averageOf(List<RevenuePoint> points) {
        return Math.round(points.stream().mapToLong(RevenuePoint::reportedRevenue).average().orElse(0.0));
    }
}
