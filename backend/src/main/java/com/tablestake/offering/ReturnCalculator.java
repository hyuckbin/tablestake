package com.tablestake.offering;

import com.tablestake.global.util.Numbers;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * 매출 연동 상품의 예상 수익률을 계산한다.
 * 원금이 매달 조금씩 돌아오므로 단순히 (배수 - 1) / 기간 으로 나누면 안 되고,
 * 현금흐름의 내부수익률(IRR)을 구해 연 환산한다.
 */
public final class ReturnCalculator {

    private ReturnCalculator() {
    }

    public static Projection project(long principal, long monthlyPayout, BigDecimal capMultiple, int maxTermMonths) {
        long capAmount = BigDecimal.valueOf(principal).multiply(capMultiple).setScale(0, RoundingMode.DOWN).longValue();
        if (principal <= 0 || monthlyPayout <= 0) {
            return new Projection(Math.max(monthlyPayout, 0L), maxTermMonths, 0L, capAmount, -100.0, false);
        }
        long monthsToCap = (capAmount + monthlyPayout - 1) / monthlyPayout;
        boolean reachesCap = monthsToCap <= maxTermMonths;
        int months = (int) Math.min(monthsToCap, maxTermMonths);

        long[] flows = new long[months];
        long total = 0L;
        for (int i = 0; i < months; i++) {
            long payment = monthlyPayout;
            if (reachesCap && i == months - 1) {
                payment = capAmount - monthlyPayout * (months - 1L);
            }
            flows[i] = payment;
            total += payment;
        }
        double annual = annualizedReturn(principal, flows);
        return new Projection(monthlyPayout, months, total, capAmount, Numbers.round1(annual * 100), reachesCap);
    }

    static double annualizedReturn(long principal, long[] monthlyFlows) {
        double low = -0.99;
        double high = 1.0;
        for (int i = 0; i < 200; i++) {
            double mid = (low + high) / 2;
            if (netPresentValue(principal, monthlyFlows, mid) > 0) {
                low = mid;
            } else {
                high = mid;
            }
        }
        double monthlyRate = (low + high) / 2;
        return Math.pow(1 + monthlyRate, 12) - 1;
    }

    private static double netPresentValue(long principal, long[] flows, double monthlyRate) {
        double value = -principal;
        double discount = 1.0;
        for (long flow : flows) {
            discount /= (1 + monthlyRate);
            value += flow * discount;
        }
        return value;
    }
}
