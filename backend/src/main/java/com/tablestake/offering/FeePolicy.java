package com.tablestake.offering;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * 플랫폼 수수료 (팀 기획안: 모집 5% + 정산 2%).
 * <ul>
 *   <li>모집 수수료: 모은 돈의 5%를 가게가 낸다. 가게는 95%를 받고, 투자자 수익에는 영향이 없다.</li>
 *   <li>정산 수수료: 가게가 매달 낸 돈의 2%를 플랫폼이 떼고 나머지 98%를 투자자에게 나눈다.
 *       상환 상한(1.3배)은 가게가 낸 돈 기준이라, 투자자가 받는 최대 금액은 1.3 × 0.98 = 1.274배다.</li>
 * </ul>
 */
public final class FeePolicy {

    public static final BigDecimal RECRUIT_FEE_RATE = new BigDecimal("0.05");
    public static final BigDecimal SETTLEMENT_FEE_RATE = new BigDecimal("0.02");

    private FeePolicy() {
    }

    /** 정산 수수료. 1원 미만은 버려 투자자에게 유리하게 한다. */
    public static long settlementFeeOf(long paidAmount) {
        return BigDecimal.valueOf(paidAmount).multiply(SETTLEMENT_FEE_RATE)
                .setScale(0, RoundingMode.FLOOR).longValueExact();
    }

    /** 가게가 낸 돈에서 정산 수수료를 뺀, 투자자에게 나눌 돈 */
    public static long investorShareOf(long paidAmount) {
        return paidAmount - settlementFeeOf(paidAmount);
    }

    public static long recruitFeeOf(long raisedAmount) {
        return BigDecimal.valueOf(raisedAmount).multiply(RECRUIT_FEE_RATE)
                .setScale(0, RoundingMode.FLOOR).longValueExact();
    }

    /** 투자자가 받는 최대 배수 = 상환 배수 × (1 − 정산 수수료율) */
    public static BigDecimal investorCapMultiple(BigDecimal repaymentCapMultiple) {
        return repaymentCapMultiple.multiply(BigDecimal.ONE.subtract(SETTLEMENT_FEE_RATE));
    }

    public static double settlementFeePercent() {
        return SETTLEMENT_FEE_RATE.movePointRight(2).doubleValue();
    }

    public static double recruitFeePercent() {
        return RECRUIT_FEE_RATE.movePointRight(2).doubleValue();
    }
}
