package com.tablestake.anomaly;

import com.tablestake.global.util.Stats;
import com.tablestake.store.RevenuePoint;

import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

/**
 * 월 매출 데이터에서 조작 가능성이 있는 패턴을 찾는다.
 * 각 달은 그 이전 최대 12개월만 기준으로 판단한다(그 달 이후 데이터는 쓰지 않는다).
 */
public class RevenueAnomalyDetector {

    static final int WINDOW_MONTHS = 12;
    static final int MIN_WINDOW_MONTHS = 6;
    static final double CARD_RATIO_DROP_THRESHOLD = 0.15;
    static final double SPIKE_SCORE_MEDIUM = 3.0;
    static final double SPIKE_SCORE_HIGH = 4.0;
    static final double SPIKE_CHANGE_MEDIUM = 0.20;
    static final double SPIKE_CHANGE_HIGH = 0.30;
    static final double DROP_SCORE = -4.0;
    static final double DROP_CHANGE = -0.25;
    static final double RECENT_SURGE_THRESHOLD = 0.30;

    public List<RevenueAlert> detect(List<RevenuePoint> history, YearMonth target) {
        RevenuePoint current = null;
        List<RevenuePoint> previous = new ArrayList<>();
        for (RevenuePoint point : sorted(history)) {
            if (point.month().isBefore(target)) {
                previous.add(point);
            } else if (point.month().equals(target)) {
                current = point;
            }
        }
        if (current == null) {
            return List.of();
        }

        List<RevenueAlert> alerts = new ArrayList<>();
        if (current.cardRevenue() > current.reportedRevenue()) {
            alerts.add(new RevenueAlert(target, AlertType.CARD_EXCEEDS_REPORTED, Severity.HIGH,
                    String.format("카드사 승인 매출(%,d원)이 신고 매출(%,d원)보다 많습니다. 신고에서 빠진 매출이 있을 수 있습니다.",
                            current.cardRevenue(), current.reportedRevenue()),
                    String.format("카드 %,d원 > 신고 %,d원", current.cardRevenue(), current.reportedRevenue())));
        }

        List<RevenuePoint> window = previous.subList(Math.max(0, previous.size() - WINDOW_MONTHS), previous.size());
        if (window.size() < MIN_WINDOW_MONTHS) {
            return alerts;
        }

        double baselineRatio = window.stream().mapToDouble(RevenuePoint::cardRatio).average().orElse(0.0);
        double currentRatio = current.cardRatio();
        if (baselineRatio - currentRatio >= CARD_RATIO_DROP_THRESHOLD) {
            alerts.add(new RevenueAlert(target, AlertType.CARD_RATIO_DROP, Severity.HIGH,
                    String.format("평소 %.0f%%였던 카드 결제 비중이 %.0f%%로 떨어졌습니다. 현금 결제를 유도하면 매출이 신고에서 빠질 수 있어 정산 전에 확인해야 합니다.",
                            baselineRatio * 100, currentRatio * 100),
                    String.format("카드 비중 %.0f%% → %.0f%%", baselineRatio * 100, currentRatio * 100)));
        }

        List<Double> reported = window.stream().map(point -> (double) point.reportedRevenue()).toList();
        double median = Stats.median(reported);
        double score = Stats.robustZScore(current.reportedRevenue(), reported);
        double change = median == 0.0 ? 0.0 : current.reportedRevenue() / median - 1;
        // 통계적으로 튀고(score) 실제 변화 폭도 커야(change) 경고한다. 계절 변동 같은 작은 흔들림은 넘긴다.
        if (score >= SPIKE_SCORE_MEDIUM && change >= SPIKE_CHANGE_MEDIUM) {
            boolean high = score >= SPIKE_SCORE_HIGH && change >= SPIKE_CHANGE_HIGH;
            Severity severity = high ? Severity.HIGH : Severity.MEDIUM;
            alerts.add(new RevenueAlert(target, AlertType.REVENUE_SPIKE, severity,
                    String.format("최근 %d개월 중앙값보다 매출이 %.0f%% 높습니다. 셀프 결제 같은 방식으로 매출을 부풀렸는지 확인이 필요합니다.",
                            window.size(), change * 100),
                    String.format("이상 점수 %.1f, 중앙값 대비 +%.0f%%", score, change * 100)));
        } else if (score <= DROP_SCORE && change <= DROP_CHANGE) {
            alerts.add(new RevenueAlert(target, AlertType.REVENUE_DROP, Severity.MEDIUM,
                    String.format("최근 %d개월 중앙값보다 매출이 %.0f%% 낮습니다. 이번 달 지급액이 줄어듭니다.",
                            window.size(), Math.abs(change * 100)),
                    String.format("이상 점수 %.1f, 중앙값 대비 %.0f%%", score, change * 100)));
        }
        return alerts;
    }

    /**
     * 최근 3개월 평균이 그 전 9개월 평균보다 크게 높으면 경고한다.
     * 모집 직전에 매출을 부풀려 모집 한도를 키우는 수법을 잡기 위한 규칙이다.
     */
    public Optional<RevenueAlert> detectRecentSurge(List<RevenuePoint> history) {
        List<RevenuePoint> sorted = sorted(history);
        if (sorted.size() < 12) {
            return Optional.empty();
        }
        List<RevenuePoint> recent = sorted.subList(sorted.size() - 3, sorted.size());
        List<RevenuePoint> prior = sorted.subList(sorted.size() - 12, sorted.size() - 3);
        double recentAverage = recent.stream().mapToLong(RevenuePoint::reportedRevenue).average().orElse(0.0);
        double priorAverage = prior.stream().mapToLong(RevenuePoint::reportedRevenue).average().orElse(0.0);
        if (priorAverage == 0.0) {
            return Optional.empty();
        }
        double change = recentAverage / priorAverage - 1;
        if (change < RECENT_SURGE_THRESHOLD) {
            return Optional.empty();
        }
        YearMonth lastMonth = recent.get(recent.size() - 1).month();
        return Optional.of(new RevenueAlert(lastMonth, AlertType.RECENT_SURGE, Severity.HIGH,
                String.format("최근 3개월 평균 매출이 그 전 9개월보다 %.0f%% 높습니다. 모집 직전에 매출을 부풀렸을 수 있어 모집 한도 계산에서 이 기간을 뺍니다.",
                        change * 100),
                String.format("최근 3개월 +%.0f%%", change * 100)));
    }

    private static List<RevenuePoint> sorted(List<RevenuePoint> history) {
        return history.stream().sorted(Comparator.comparing(RevenuePoint::month)).toList();
    }
}
