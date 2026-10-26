package com.tablestake.store;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.LocalDate;
import java.time.YearMonth;

/**
 * 가게의 월 매출. 같은 가게, 같은 달은 한 번만 등록할 수 있다(유니크 제약).
 */
@Entity
@Table(name = "monthly_revenue", uniqueConstraints = @UniqueConstraint(
        name = "uk_monthly_revenue_store_month", columnNames = {"store_id", "revenue_month"}))
public class MonthlyRevenue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "store_id", nullable = false)
    private Store store;

    /** 해당 월의 1일. */
    @Column(name = "revenue_month", nullable = false)
    private LocalDate revenueMonth;

    /** 신고 매출(원). 지급액 계산 기준. */
    @Column(nullable = false)
    private long reportedRevenue;

    /** 카드사 승인 매출(원). 교차 검증용. */
    @Column(nullable = false)
    private long cardRevenue;

    protected MonthlyRevenue() {
    }

    public MonthlyRevenue(Store store, YearMonth month, long reportedRevenue, long cardRevenue) {
        this.store = store;
        this.revenueMonth = month.atDay(1);
        this.reportedRevenue = reportedRevenue;
        this.cardRevenue = cardRevenue;
    }

    public RevenuePoint toPoint() {
        return new RevenuePoint(YearMonth.from(revenueMonth), reportedRevenue, cardRevenue);
    }

    public Long getId() {
        return id;
    }

    public Store getStore() {
        return store;
    }

    public LocalDate getRevenueMonth() {
        return revenueMonth;
    }

    public long getReportedRevenue() {
        return reportedRevenue;
    }

    public long getCardRevenue() {
        return cardRevenue;
    }
}
