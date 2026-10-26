package com.tablestake.store.analysis;

import com.tablestake.global.util.Stats;
import com.tablestake.store.RevenuePoint;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * 운영 기간, 매출 변동성, 최근 경고 수로 위험 등급(A/B/C)을 매긴다.
 */
public class RiskGrader {

    public RiskAssessment assess(LocalDate openedOn, YearMonth reference, List<RevenuePoint> last12, int highAlertCount) {
        long months = Math.max(0, ChronoUnit.MONTHS.between(YearMonth.from(openedOn), reference));
        List<Double> revenues = last12.stream().map(point -> (double) point.reportedRevenue()).toList();
        double mean = Stats.mean(revenues);
        double volatility = mean == 0.0 ? 0.0 : Stats.populationStdDev(revenues) / mean;

        String grade;
        if (highAlertCount > 0) {
            grade = "C";
        } else if (months >= 36 && volatility <= 0.12) {
            grade = "A";
        } else if (months >= 24 && volatility <= 0.20) {
            grade = "B";
        } else {
            grade = "C";
        }

        List<String> reasons = List.of(
                String.format("운영 기간 %d년 %d개월", months / 12, months % 12),
                String.format("최근 12개월 매출 변동성 %.1f%%", volatility * 100),
                highAlertCount > 0 ? String.format("최근 12개월 매출 경고 %d건", highAlertCount) : "최근 12개월 매출 경고 없음");
        return new RiskAssessment(grade, reasons);
    }
}
