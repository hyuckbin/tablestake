package com.tablestake.store;

/**
 * 가게가 속한 시장. 포항에서 실증하고(SOM) 국내(SAM), 해외(TAM) 순서로 넓힌다.
 */
public enum MarketRegion {
    POHANG("포항"),
    DOMESTIC("국내"),
    OVERSEAS("해외");

    private final String label;

    MarketRegion(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
