package com.tablestake.global.util;

public final class Numbers {

    private Numbers() {
    }

    /** 0.8 -> 80.0 처럼 비율을 소수 첫째 자리 퍼센트로 바꾼다. */
    public static double percent(double ratio) {
        return Math.round(ratio * 1000.0) / 10.0;
    }

    public static double round1(double value) {
        return Math.round(value * 10.0) / 10.0;
    }
}
