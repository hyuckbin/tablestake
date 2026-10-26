package com.tablestake.offering;

/**
 * 예상 지급 시나리오.
 *
 * @param monthlyPayout          예상 월 지급액
 * @param expectedMonths         지급이 끝날 때까지 예상 개월 수
 * @param expectedTotal          받을 것으로 예상되는 총액
 * @param capAmount              상환 상한(원금 × 배수)
 * @param annualReturnPercent    연 환산 수익률(세전, %)
 * @param reachesCapWithinTerm   계약 기간 안에 상한을 채우는지
 */
public record Projection(long monthlyPayout, int expectedMonths, long expectedTotal, long capAmount,
                         double annualReturnPercent, boolean reachesCapWithinTerm) {
}
