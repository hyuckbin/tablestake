package com.tablestake.demo;

import com.tablestake.anomaly.AlertType;
import com.tablestake.anomaly.RevenueAlert;
import com.tablestake.demo.SeedRevenueGenerator.Profile;
import com.tablestake.store.RevenuePoint;
import com.tablestake.store.analysis.StoreAnalysis;
import com.tablestake.store.analysis.StoreAnalyzer;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * 발표 날짜가 바뀌어도 시드 매출이 의도대로 보이는지 확인한다.
 * 데모 데이터는 실행 날짜 기준으로 만들어지므로, 24개월 동안 어느 달에 켜도 결과가 같아야 한다.
 */
class SeedRevenueGeneratorTest {

    private final SeedRevenueGenerator generator = new SeedRevenueGenerator();
    private final StoreAnalyzer analyzer = new StoreAnalyzer();

    @Test
    @DisplayName("계절 성수기나 꾸준한 성장을 이상 매출로 오해하지 않는다")
    void seasonalProfilesStayClean() {
        for (Profile profile : Profile.values()) {
            for (int offset = 0; offset < 24; offset++) {
                YearMonth last = YearMonth.of(2026, 1).plusMonths(offset);
                List<RevenuePoint> history = generator.generate(profile, last, 24);
                StoreAnalysis analysis = analyzer.analyze(history, LocalDate.of(2015, 1, 1), last.plusMonths(2));

                List<RevenueAlert> lastYearAlerts = analysis.last12().stream()
                        .flatMap(point -> analysis.alertsFor(point.month()).stream())
                        .toList();
                assertTrue(lastYearAlerts.isEmpty(), () -> profile + " " + last + " " + lastYearAlerts);
                assertTrue(analysis.recentSurge().isEmpty(), () -> profile + " " + last + " 최근 3개월 급등");
            }
        }
    }

    @Test
    @DisplayName("현금 결제 유도 시나리오는 언제 실행해도 마지막 달에 카드 비중 급감 경고를 낸다")
    void loweredCardRatioIsFlagged() {
        for (int offset = 0; offset < 24; offset++) {
            YearMonth last = YearMonth.of(2026, 1).plusMonths(offset);
            List<RevenuePoint> history = generator.lowerLastCardRatio(generator.generate(Profile.PADTHAI, last, 24), 0.41);
            StoreAnalysis analysis = analyzer.analyze(history, LocalDate.of(2021, 1, 1), last.plusMonths(2));

            List<RevenueAlert> alerts = analysis.alertsFor(last);
            assertEquals(1, alerts.size(), () -> last + " " + alerts);
            assertEquals(AlertType.CARD_RATIO_DROP, alerts.get(0).type());
        }
    }

    @Test
    @DisplayName("성장 프로필은 1년 전보다 매출이 늘어난 것으로 계산된다")
    void growthProfilesGrowYearOverYear() {
        YearMonth last = YearMonth.of(2026, 8);
        StoreAnalysis bagel = analyzer.analyze(generator.generate(Profile.BAGEL, last, 24), LocalDate.of(2022, 9, 1), last);
        StoreAnalysis burger = analyzer.analyze(generator.generate(Profile.BURGER, last, 24), LocalDate.of(2021, 6, 1), last);

        assertTrue(bagel.yearOverYearGrowth() > 0.10, () -> "베이글 " + bagel.yearOverYearGrowth());
        assertTrue(Math.abs(burger.yearOverYearGrowth()) < 0.08, () -> "수제버거 " + burger.yearOverYearGrowth());
    }
}
