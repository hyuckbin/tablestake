package com.tablestake.store.analysis;

import com.tablestake.anomaly.RevenueAlert;
import com.tablestake.anomaly.Severity;
import com.tablestake.store.RevenuePoint;

import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

/**
 * 한 가게의 매출 분석 결과(이상 탐지, 한도 계산에서 뺄 달, 위험 등급).
 */
public record StoreAnalysis(
        List<RevenuePoint> history,
        Map<YearMonth, List<RevenueAlert>> alertsByMonth,
        Optional<RevenueAlert> recentSurge,
        List<RevenuePoint> last12,
        Set<YearMonth> excludedMonths,
        RiskAssessment risk) {

    public List<RevenueAlert> alertsFor(YearMonth month) {
        return alertsByMonth.getOrDefault(month, List.of());
    }

    /** 최근 3개월 경고와 최근 급등 경고. 투자자 화면의 '매출 검증' 상태를 정한다. */
    public List<RevenueAlert> recentAlerts() {
        List<RevenueAlert> result = new ArrayList<>();
        int from = Math.max(0, history.size() - 3);
        for (RevenuePoint point : history.subList(from, history.size())) {
            result.addAll(alertsFor(point.month()));
        }
        recentSurge.ifPresent(result::add);
        return result;
    }

    public VerificationStatus verificationStatus() {
        List<RevenueAlert> recent = recentAlerts();
        if (recent.isEmpty()) {
            return VerificationStatus.NORMAL;
        }
        boolean hasHigh = recent.stream().anyMatch(alert -> alert.severity() == Severity.HIGH);
        return hasHigh ? VerificationStatus.WARNING : VerificationStatus.CAUTION;
    }

    public Optional<RevenuePoint> latest() {
        return history.isEmpty() ? Optional.empty() : Optional.of(history.get(history.size() - 1));
    }

    /**
     * 최근 3개월 매출이 1년 전 같은 3개월보다 얼마나 늘었는지(비율). 계절 변동을 피하려고 전년 같은 달과 비교한다.
     * 이력이 15개월보다 짧으면 비교할 수 없어 0을 돌려준다.
     */
    public double yearOverYearGrowth() {
        int size = history.size();
        if (size < 15) {
            return 0.0;
        }
        long recent = sumReported(history.subList(size - 3, size));
        long yearAgo = sumReported(history.subList(size - 15, size - 12));
        return yearAgo == 0 ? 0.0 : (double) recent / yearAgo - 1;
    }

    private static long sumReported(List<RevenuePoint> points) {
        return points.stream().mapToLong(RevenuePoint::reportedRevenue).sum();
    }
}
