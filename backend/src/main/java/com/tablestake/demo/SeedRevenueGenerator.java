package com.tablestake.demo;

import com.tablestake.store.RevenuePoint;

import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

/**
 * 데모용 월 매출을 만든다. 시드가 고정되어 있어 실행할 때마다 같은 모양의 데이터가 나온다.
 * 계절 변동은 ±15% 안으로 둔다. 더 크면 이상 탐지(급등·최근 3개월 급등)가 계절 성수기를 조작으로 오해한다.
 */
public class SeedRevenueGenerator {

    public enum Profile {
        GUKBAP(10_200_000L, 0.80, new double[]{1.05, 1.04, 1.00, 0.98, 0.97, 0.96, 0.96, 0.97, 0.99, 1.01, 1.03, 1.05}, 11L, 0.0),
        BURGER(14_000_000L, 0.93, new double[]{0.98, 0.97, 0.99, 1.01, 1.02, 1.03, 1.04, 1.03, 1.00, 0.99, 0.97, 0.99}, 22L, 0.0),
        PHO(8_000_000L, 0.88, new double[]{1.04, 1.03, 1.00, 0.99, 0.98, 0.97, 0.97, 0.98, 1.00, 1.01, 1.02, 1.03}, 33L, 0.0),
        BUNSIK(6_000_000L, 0.90, new double[]{0.97, 0.96, 1.02, 1.03, 1.02, 1.00, 0.97, 0.96, 1.02, 1.03, 1.02, 1.00}, 44L, 0.0),
        /** 물회: 여름 성수기 */
        MULHOE(12_500_000L, 0.86, new double[]{0.90, 0.90, 0.94, 0.98, 1.03, 1.09, 1.13, 1.14, 1.06, 0.99, 0.94, 0.91}, 55L, 0.0),
        /** 바닷가 브런치 카페: 여름에 조금 높고 꾸준히 성장 */
        BRUNCH(9_500_000L, 0.95, new double[]{0.95, 0.95, 0.98, 1.00, 1.03, 1.04, 1.08, 1.10, 1.02, 0.99, 0.96, 0.95}, 66L, 0.004),
        /** 성수동 베이글: 빠르게 성장 */
        BAGEL(16_000_000L, 0.96, new double[]{0.98, 0.98, 1.00, 1.01, 1.01, 0.99, 0.98, 0.98, 1.01, 1.02, 1.02, 1.03}, 77L, 0.012),
        /** 도쿄 스시: 연말 성수기, 한국인 손님이 늘며 성장 */
        SUSHI(28_000_000L, 0.74, new double[]{0.98, 0.96, 1.01, 1.02, 1.00, 0.98, 0.98, 1.00, 0.99, 1.01, 1.02, 1.05}, 88L, 0.010),
        /** 방콕 팟타이: 현금 손님이 많다 */
        PADTHAI(7_500_000L, 0.62, new double[]{1.02, 1.02, 1.04, 1.06, 1.00, 0.96, 0.96, 0.97, 0.96, 0.98, 1.03, 1.05}, 99L, 0.0),
        /** 파리 비스트로: 8월 휴가철에 손님이 준다 */
        BISTRO(19_000_000L, 0.91, new double[]{0.94, 0.95, 1.00, 1.03, 1.05, 1.06, 1.00, 0.86, 1.03, 1.04, 1.02, 1.08}, 111L, 0.003),
        /** 경주 한옥 찻집: 봄·가을 관광철 */
        HANOK_TEA(6_800_000L, 0.90, new double[]{0.92, 0.94, 1.02, 1.06, 1.07, 1.00, 0.98, 0.99, 1.03, 1.08, 1.00, 0.93}, 122L, 0.006);

        /** 마지막 달 기준 매출 규모 */
        private final long baseRevenue;
        private final double cardRatio;
        private final double[] seasonality;
        private final long seed;
        /** 월 성장률. 0.012 = 매달 1.2%씩 늘어 온 가게 */
        private final double monthlyGrowth;

        Profile(long baseRevenue, double cardRatio, double[] seasonality, long seed, double monthlyGrowth) {
            this.baseRevenue = baseRevenue;
            this.cardRatio = cardRatio;
            this.seasonality = seasonality;
            this.seed = seed;
            this.monthlyGrowth = monthlyGrowth;
        }
    }

    public List<RevenuePoint> generate(Profile profile, YearMonth lastMonth, int months) {
        Random random = new Random(profile.seed);
        YearMonth start = lastMonth.minusMonths(months - 1L);
        List<RevenuePoint> points = new ArrayList<>(months);
        for (int i = 0; i < months; i++) {
            YearMonth month = start.plusMonths(i);
            double seasonal = profile.seasonality[month.getMonthValue() - 1];
            double trend = Math.pow(1 + profile.monthlyGrowth, i - (months - 1.0));
            double noise = 1 + (random.nextDouble() * 2 - 1) * 0.04;
            long reported = roundToThousand(profile.baseRevenue * seasonal * trend * noise);
            double ratio = profile.cardRatio + (random.nextDouble() * 2 - 1) * 0.015;
            long card = roundToThousand(reported * ratio);
            points.add(new RevenuePoint(month, reported, card));
        }
        return points;
    }

    /** 마지막 몇 달의 매출을 부풀린다(셀프 결제 시나리오). 셀프 결제는 카드로 하므로 카드 매출이 조금 더 늘어난다. */
    public List<RevenuePoint> inflateRecent(List<RevenuePoint> points, int recentMonths, double multiplier) {
        List<RevenuePoint> result = new ArrayList<>(points);
        for (int i = Math.max(0, result.size() - recentMonths); i < result.size(); i++) {
            RevenuePoint point = result.get(i);
            long reported = roundToThousand(point.reportedRevenue() * multiplier);
            long card = Math.min(reported, roundToThousand(point.cardRevenue() * (multiplier + 0.05)));
            result.set(i, new RevenuePoint(point.month(), reported, card));
        }
        return result;
    }

    /** 마지막 달의 카드 결제 비중만 낮춘다(현금 결제 유도 시나리오). 신고 매출은 그대로다. */
    public List<RevenuePoint> lowerLastCardRatio(List<RevenuePoint> points, double cardRatio) {
        List<RevenuePoint> result = new ArrayList<>(points);
        RevenuePoint last = result.get(result.size() - 1);
        result.set(result.size() - 1,
                new RevenuePoint(last.month(), last.reportedRevenue(), roundToThousand(last.reportedRevenue() * cardRatio)));
        return result;
    }

    private static long roundToThousand(double value) {
        return Math.round(value / 1_000.0) * 1_000L;
    }
}
