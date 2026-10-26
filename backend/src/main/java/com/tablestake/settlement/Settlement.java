package com.tablestake.settlement;

import com.tablestake.offering.Offering;
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
import java.time.LocalDateTime;
import java.time.YearMonth;

/**
 * 한 상품의 한 달 정산. 같은 상품, 같은 달은 DB 유니크 제약으로 한 번만 정산된다.
 */
@Entity
@Table(name = "settlement", uniqueConstraints = @UniqueConstraint(
        name = "uk_settlement_offering_month", columnNames = {"offering_id", "settlement_month"}))
public class Settlement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "offering_id", nullable = false)
    private Offering offering;

    @Column(name = "settlement_month", nullable = false)
    private LocalDate settlementMonth;

    /** 기준 매출(신고 매출). */
    @Column(nullable = false)
    private long baseRevenue;

    /** 기준 매출 × 연동 비율. */
    @Column(nullable = false)
    private long grossAmount;

    /** 상환 상한을 반영해 가게가 실제로 낸 돈. 상환 상한은 이 금액으로 센다. */
    @Column(nullable = false)
    private long paidAmount;

    /** 정산 수수료(가게가 낸 돈의 2%). 투자자에게는 paidAmount − platformFee 를 나눈다. */
    @Column(nullable = false)
    private long platformFee;

    @Column(nullable = false)
    private long remainingCapBefore;

    @Column(nullable = false)
    private long totalPaidAfter;

    @Column(nullable = false)
    private boolean capReached;

    /** 이상 탐지 경고를 확인한 뒤 진행한 정산인지. */
    @Column(nullable = false)
    private boolean anomalyOverridden;

    @Column(nullable = false)
    private LocalDateTime settledAt;

    protected Settlement() {
    }

    public Settlement(Offering offering, YearMonth month, long baseRevenue, long grossAmount, long paidAmount,
                      long platformFee, long remainingCapBefore, long totalPaidAfter, boolean capReached,
                      boolean anomalyOverridden, LocalDateTime settledAt) {
        this.offering = offering;
        this.settlementMonth = month.atDay(1);
        this.baseRevenue = baseRevenue;
        this.grossAmount = grossAmount;
        this.paidAmount = paidAmount;
        this.platformFee = platformFee;
        this.remainingCapBefore = remainingCapBefore;
        this.totalPaidAfter = totalPaidAfter;
        this.capReached = capReached;
        this.anomalyOverridden = anomalyOverridden;
        this.settledAt = settledAt;
    }

    public YearMonth getYearMonth() {
        return YearMonth.from(settlementMonth);
    }

    public Long getId() {
        return id;
    }

    public Offering getOffering() {
        return offering;
    }

    public LocalDate getSettlementMonth() {
        return settlementMonth;
    }

    public long getBaseRevenue() {
        return baseRevenue;
    }

    public long getGrossAmount() {
        return grossAmount;
    }

    public long getPaidAmount() {
        return paidAmount;
    }

    public long getPlatformFee() {
        return platformFee;
    }

    /** 투자자에게 나눈 돈 */
    public long getInvestorAmount() {
        return paidAmount - platformFee;
    }

    public long getRemainingCapBefore() {
        return remainingCapBefore;
    }

    public long getTotalPaidAfter() {
        return totalPaidAfter;
    }

    public boolean isCapReached() {
        return capReached;
    }

    public boolean isAnomalyOverridden() {
        return anomalyOverridden;
    }

    public LocalDateTime getSettledAt() {
        return settledAt;
    }
}
