package com.tablestake.store.dto;

import com.tablestake.anomaly.RevenueAlert;
import com.tablestake.global.util.Numbers;
import com.tablestake.store.RevenuePoint;
import com.tablestake.store.Store;
import com.tablestake.store.analysis.FundingLimit;
import com.tablestake.store.analysis.RiskAssessment;
import com.tablestake.store.analysis.StoreAnalysis;
import com.tablestake.store.analysis.VerificationStatus;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * 가게 분석 결과를 API 응답으로 바꾼다.
 */
public final class StoreDtoMapper {

    private StoreDtoMapper() {
    }

    public static List<AlertResponse> alerts(List<RevenueAlert> alerts) {
        return alerts.stream().map(AlertResponse::from).toList();
    }

    public static VerificationResponse verification(StoreAnalysis analysis) {
        VerificationStatus status = analysis.verificationStatus();
        return new VerificationResponse(status.name(), status.getLabel(), alerts(analysis.recentAlerts()));
    }

    public static RiskResponse risk(RiskAssessment risk) {
        return new RiskResponse(risk.grade(), risk.gradeLabel(), risk.reasons());
    }

    public static StoreInfoResponse storeInfo(Store store, YearMonth reference) {
        int months = (int) Math.max(0, ChronoUnit.MONTHS.between(YearMonth.from(store.getOpenedOn()), reference));
        return new StoreInfoResponse(store.getId(), store.getName(), store.getRegion().name(),
                store.getRegion().getLabel(), store.getCity(), store.getArea(), store.getCategory(),
                store.getDescription(), store.getBusinessType().getLabel(), store.getOpenedOn().toString(), months,
                store.getCurrency(), store.getImageKey());
    }

    public static FundingLimitResponse fundingLimit(FundingLimit limit, BigDecimal shareRate, int termMonths,
                                                    BigDecimal capMultiple, long targetAmount) {
        return new FundingLimitResponse(
                limit.averageRevenueAll(),
                limit.averageRevenueClean(),
                limit.excludedMonths().stream().map(YearMonth::toString).toList(),
                limit.limitAll(),
                limit.limitClean(),
                limit.basisMonths(),
                Numbers.percent(shareRate.doubleValue()),
                termMonths,
                capMultiple.doubleValue(),
                targetAmount,
                targetAmount <= limit.limitClean());
    }

    /** 최근 n개월 매출 행. descending이면 최신 달이 먼저 온다. */
    public static List<RevenueRowResponse> revenueRows(StoreAnalysis analysis, int lastMonths, boolean descending) {
        List<RevenuePoint> history = analysis.history();
        List<RevenueRowResponse> rows = new ArrayList<>();
        for (RevenuePoint point : history.subList(Math.max(0, history.size() - lastMonths), history.size())) {
            rows.add(new RevenueRowResponse(
                    point.month().toString(),
                    point.reportedRevenue(),
                    point.cardRevenue(),
                    Numbers.percent(point.cardRatio()),
                    analysis.excludedMonths().contains(point.month()),
                    alerts(analysis.alertsFor(point.month()))));
        }
        if (descending) {
            Collections.reverse(rows);
        }
        return rows;
    }
}
