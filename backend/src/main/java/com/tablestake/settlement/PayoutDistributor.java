package com.tablestake.settlement;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.IntStream;

/**
 * 이번 달 지급액을 투자 금액 비율대로 나눈다.
 * 각자 몫을 원 단위로 내림한 뒤, 남는 원은 소수점 아래가 큰 순서대로 1원씩 더 준다(최대 잔여법).
 * 그래서 분배 합계가 항상 지급액과 정확히 같다.
 */
public final class PayoutDistributor {

    public record Share(long key, long weight) {
    }

    public record Allocation(long key, long amount) {
    }

    private PayoutDistributor() {
    }

    public static List<Allocation> distribute(long total, List<Share> shares) {
        if (total < 0) {
            throw new IllegalArgumentException("지급액은 0원 이상이어야 합니다: " + total);
        }
        if (shares.isEmpty()) {
            if (total == 0) {
                return List.of();
            }
            throw new IllegalArgumentException("나눠 받을 투자가 없습니다.");
        }

        long weightSum = 0L;
        for (Share share : shares) {
            if (share.weight() <= 0) {
                throw new IllegalArgumentException("투자 금액은 0원보다 커야 합니다: " + share.key());
            }
            weightSum = Math.addExact(weightSum, share.weight());
        }

        int size = shares.size();
        long[] amounts = new long[size];
        long[] remainders = new long[size];
        long distributed = 0L;
        for (int i = 0; i < size; i++) {
            long product = Math.multiplyExact(total, shares.get(i).weight());
            amounts[i] = product / weightSum;
            remainders[i] = product % weightSum;
            distributed += amounts[i];
        }

        long leftover = total - distributed;
        List<Integer> order = IntStream.range(0, size).boxed()
                .sorted(Comparator.<Integer>comparingLong(i -> remainders[i]).reversed()
                        .thenComparingLong(i -> shares.get(i).key()))
                .toList();
        for (int i = 0; i < leftover; i++) {
            amounts[order.get(i)]++;
        }

        List<Allocation> result = new ArrayList<>(size);
        for (int i = 0; i < size; i++) {
            result.add(new Allocation(shares.get(i).key(), amounts[i]));
        }
        return result;
    }
}
