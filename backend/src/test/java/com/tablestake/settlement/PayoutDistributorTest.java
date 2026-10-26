package com.tablestake.settlement;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PayoutDistributorTest {

    @Test
    @DisplayName("투자 금액 비율대로 나누고 합계는 지급액과 같다")
    void distributesProportionally() {
        List<PayoutDistributor.Share> shares = List.of(
                new PayoutDistributor.Share(1L, 100_000L),
                new PayoutDistributor.Share(2L, 300_000L),
                new PayoutDistributor.Share(3L, 600_000L));

        List<PayoutDistributor.Allocation> result = PayoutDistributor.distribute(100_000L, shares);

        assertEquals(10_000L, result.get(0).amount());
        assertEquals(30_000L, result.get(1).amount());
        assertEquals(60_000L, result.get(2).amount());
    }

    @Test
    @DisplayName("나누어 떨어지지 않으면 남는 원을 소수점 아래가 큰 순서로 준다")
    void givesLeftoverByLargestRemainder() {
        List<PayoutDistributor.Share> shares = List.of(
                new PayoutDistributor.Share(1L, 1L),
                new PayoutDistributor.Share(2L, 1L),
                new PayoutDistributor.Share(3L, 1L));

        List<PayoutDistributor.Allocation> result = PayoutDistributor.distribute(100L, shares);

        assertEquals(34L, result.get(0).amount());
        assertEquals(33L, result.get(1).amount());
        assertEquals(33L, result.get(2).amount());
    }

    @Test
    @DisplayName("무작위 입력에서도 분배 합계가 항상 지급액과 같다")
    void sumAlwaysMatches() {
        Random random = new Random(42L);
        for (int round = 0; round < 500; round++) {
            List<PayoutDistributor.Share> shares = new ArrayList<>();
            int count = 1 + random.nextInt(100);
            for (int i = 0; i < count; i++) {
                shares.add(new PayoutDistributor.Share(i + 1L, (1 + random.nextInt(500)) * 10_000L));
            }
            long total = random.nextInt(5_000_000);

            long sum = PayoutDistributor.distribute(total, shares).stream()
                    .mapToLong(PayoutDistributor.Allocation::amount)
                    .sum();

            assertEquals(total, sum);
        }
    }

    @Test
    @DisplayName("받을 사람이 없는데 지급액이 있으면 예외")
    void rejectsEmptyShares() {
        assertThrows(IllegalArgumentException.class, () -> PayoutDistributor.distribute(1_000L, List.of()));
        assertTrue(PayoutDistributor.distribute(0L, List.of()).isEmpty());
    }
}
