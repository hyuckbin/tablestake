package com.tablestake.store.analysis;

import com.tablestake.anomaly.AlertType;
import com.tablestake.anomaly.RevenueAlert;
import com.tablestake.anomaly.RevenueAnomalyDetector;
import com.tablestake.anomaly.Severity;
import com.tablestake.store.RevenuePoint;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.TreeSet;
import java.util.stream.Collectors;

/**
 * 매출 이력 전체를 분석한다. 스프링에 의존하지 않아 단위 테스트로 검증할 수 있다.
 */
public class StoreAnalyzer {

    private final RevenueAnomalyDetector detector = new RevenueAnomalyDetector();
    private final RiskGrader riskGrader = new RiskGrader();

    public StoreAnalysis analyze(List<RevenuePoint> rawHistory, LocalDate openedOn, YearMonth reference) {
        List<RevenuePoint> history = rawHistory.stream()
                .sorted(Comparator.comparing(RevenuePoint::month))
                .toList();

        Map<YearMonth, List<RevenueAlert>> alertsByMonth = new LinkedHashMap<>();
        for (RevenuePoint point : history) {
            List<RevenueAlert> alerts = detector.detect(history, point.month());
            if (!alerts.isEmpty()) {
                alertsByMonth.put(point.month(), alerts);
            }
        }
        Optional<RevenueAlert> recentSurge = detector.detectRecentSurge(history);

        List<RevenuePoint> last12 = history.subList(Math.max(0, history.size() - 12), history.size());
        Set<YearMonth> excluded = new TreeSet<>();
        for (RevenuePoint point : last12) {
            boolean spiked = alertsByMonth.getOrDefault(point.month(), List.of()).stream()
                    .anyMatch(alert -> alert.type() == AlertType.REVENUE_SPIKE);
            if (spiked) {
                excluded.add(point.month());
            }
        }
        if (recentSurge.isPresent()) {
            history.subList(Math.max(0, history.size() - 3), history.size())
                    .forEach(point -> excluded.add(point.month()));
        }

        Set<YearMonth> last12Months = last12.stream().map(RevenuePoint::month).collect(Collectors.toSet());
        long highAlerts = alertsByMonth.entrySet().stream()
                .filter(entry -> last12Months.contains(entry.getKey()))
                .flatMap(entry -> entry.getValue().stream())
                .filter(alert -> alert.severity() == Severity.HIGH)
                .count();
        int highAlertCount = (int) highAlerts + (recentSurge.isPresent() ? 1 : 0);
        RiskAssessment risk = riskGrader.assess(openedOn, reference, last12, highAlertCount);

        return new StoreAnalysis(
                history,
                Collections.unmodifiableMap(alertsByMonth),
                recentSurge,
                List.copyOf(last12),
                Collections.unmodifiableSet(excluded),
                risk);
    }
}
