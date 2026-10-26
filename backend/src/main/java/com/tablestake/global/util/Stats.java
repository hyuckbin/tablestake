package com.tablestake.global.util;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * 매출 분석에 쓰는 기초 통계 함수.
 */
public final class Stats {

    private Stats() {
    }

    public static double mean(List<Double> values) {
        return values.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
    }

    public static double median(List<Double> values) {
        if (values.isEmpty()) {
            return 0.0;
        }
        List<Double> sorted = new ArrayList<>(values);
        Collections.sort(sorted);
        int middle = sorted.size() / 2;
        if (sorted.size() % 2 == 0) {
            return (sorted.get(middle - 1) + sorted.get(middle)) / 2.0;
        }
        return sorted.get(middle);
    }

    public static double populationStdDev(List<Double> values) {
        if (values.isEmpty()) {
            return 0.0;
        }
        double mean = mean(values);
        double variance = values.stream()
                .mapToDouble(value -> (value - mean) * (value - mean))
                .average()
                .orElse(0.0);
        return Math.sqrt(variance);
    }

    /**
     * 중앙값과 MAD(중앙값 절대 편차)로 계산한 이상 점수.
     * 평균·표준편차 방식과 달리 한두 달 튀는 값에 기준선이 끌려가지 않는다.
     */
    public static double robustZScore(double value, List<Double> sample) {
        double median = median(sample);
        List<Double> deviations = sample.stream().map(v -> Math.abs(v - median)).toList();
        double mad = median(deviations);
        if (mad == 0.0) {
            double meanDeviation = mean(deviations);
            if (meanDeviation == 0.0) {
                return value == median ? 0.0 : Math.copySign(10.0, value - median);
            }
            return (value - median) / (1.2533 * meanDeviation);
        }
        return 0.6745 * (value - median) / mad;
    }
}
