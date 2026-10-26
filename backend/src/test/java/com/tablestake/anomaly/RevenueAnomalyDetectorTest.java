package com.tablestake.anomaly;

import com.tablestake.store.RevenuePoint;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RevenueAnomalyDetectorTest {

    private static final YearMonth START = YearMonth.of(2025, 1);
    private final RevenueAnomalyDetector detector = new RevenueAnomalyDetector();

    /** 1,000만 원 안팎, 카드 비중 90%인 평범한 12개월. */
    private List<RevenuePoint> normalHistory() {
        long[] revenues = {10_100_000, 9_800_000, 10_300_000, 9_900_000, 10_000_000, 10_200_000,
                9_700_000, 10_100_000, 10_400_000, 9_900_000, 10_000_000, 10_200_000};
        List<RevenuePoint> points = new ArrayList<>();
        for (int i = 0; i < revenues.length; i++) {
            points.add(new RevenuePoint(START.plusMonths(i), revenues[i], revenues[i] * 9 / 10));
        }
        return points;
    }

    private List<RevenueAlert> detectWith(long reported, long card) {
        List<RevenuePoint> history = normalHistory();
        YearMonth target = START.plusMonths(12);
        history.add(new RevenuePoint(target, reported, card));
        return detector.detect(history, target);
    }

    @Test
    @DisplayName("평범한 달은 경고가 없다")
    void normalMonth() {
        assertTrue(detectWith(10_150_000L, 9_100_000L).isEmpty());
    }

    @Test
    @DisplayName("셀프 결제로 매출이 60% 뛰면 매출 급등 경고")
    void selfPaymentSpike() {
        List<RevenueAlert> alerts = detectWith(16_000_000L, 15_500_000L);

        assertEquals(1, alerts.size());
        assertEquals(AlertType.REVENUE_SPIKE, alerts.get(0).type());
        assertEquals(Severity.HIGH, alerts.get(0).severity());
    }

    @Test
    @DisplayName("카드 결제 비중이 90%에서 62%로 떨어지면 현금 유도 경고")
    void cashDiversion() {
        List<RevenueAlert> alerts = detectWith(9_900_000L, 6_200_000L);

        assertEquals(1, alerts.size());
        assertEquals(AlertType.CARD_RATIO_DROP, alerts.get(0).type());
    }

    @Test
    @DisplayName("카드 매출이 신고 매출보다 많으면 신고 누락 경고")
    void cardExceedsReported() {
        List<RevenueAlert> alerts = detectWith(10_000_000L, 10_500_000L);

        assertTrue(alerts.stream().anyMatch(alert -> alert.type() == AlertType.CARD_EXCEEDS_REPORTED));
    }

    @Test
    @DisplayName("최근 3개월 평균이 그 전 9개월보다 30% 이상 높으면 급등 경고")
    void recentSurge() {
        List<RevenuePoint> history = normalHistory();
        for (int i = 9; i < 12; i++) {
            RevenuePoint point = history.get(i);
            history.set(i, new RevenuePoint(point.month(), point.reportedRevenue() * 3 / 2, point.cardRevenue() * 3 / 2));
        }

        assertTrue(detector.detectRecentSurge(history).isPresent());
        assertTrue(detector.detectRecentSurge(normalHistory()).isEmpty());
    }
}
