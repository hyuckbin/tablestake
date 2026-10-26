package com.tablestake.offering;

import com.tablestake.global.error.BusinessException;
import com.tablestake.global.error.ErrorCode;
import com.tablestake.store.Store;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;

/**
 * 매출 연동 투자상품(모집 한 건).
 * 투자자는 매달 신고 매출 × 연동 비율을 투자 금액 비율대로 나눠 받고,
 * 누적 지급액이 상환 상한(모집액 × 배수)에 닿거나 계약 기간이 끝나면 지급이 끝난다.
 */
@Entity
@Table(name = "offering", indexes = @Index(name = "idx_offering_status", columnList = "status"))
public class Offering {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "store_id", nullable = false)
    private Store store;

    @Column(nullable = false, length = 80)
    private String title;

    @Column(nullable = false, length = 300)
    private String purpose;

    @Column(nullable = false)
    private long targetAmount;

    @Column(nullable = false)
    private long raisedAmount;

    /** 매출 연동 비율. 0.05 = 매출의 5%. */
    @Column(nullable = false, precision = 5, scale = 4)
    private BigDecimal revenueShareRate;

    /** 상환 상한 배수. 1.30 = 모집액의 1.3배까지 지급. */
    @Column(nullable = false, precision = 4, scale = 2)
    private BigDecimal repaymentCapMultiple;

    @Column(nullable = false)
    private int maxTermMonths;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OfferingStatus status;

    @Column(nullable = false)
    private LocalDate recruitEndsOn;

    /** 지급 시작 월의 1일. 지급 중이 되면 정해진다. */
    private LocalDate payoutStartMonth;

    @Column(nullable = false)
    private long totalPaid;

    /** 마지막으로 정산한 달의 1일. 정산할 때마다 바뀐다. */
    private LocalDate lastSettledMonth;

    /** 투자자 단골 혜택 (예: 투자자 인증 시 곱빼기 무료). 없으면 null. */
    @Column(length = 120)
    private String investorPerk;

    @Version
    private Long version;

    protected Offering() {
    }

    public Offering(Store store, String title, String purpose, long targetAmount, BigDecimal revenueShareRate,
                    BigDecimal repaymentCapMultiple, int maxTermMonths, LocalDate recruitEndsOn,
                    OfferingStatus initialStatus, String investorPerk) {
        if (initialStatus != OfferingStatus.REVIEW && initialStatus != OfferingStatus.RECRUITING) {
            throw new IllegalArgumentException("새 상품은 심사 중 또는 모집 중으로만 만들 수 있습니다.");
        }
        this.store = store;
        this.title = title;
        this.purpose = purpose;
        this.targetAmount = targetAmount;
        this.revenueShareRate = revenueShareRate;
        this.repaymentCapMultiple = repaymentCapMultiple;
        this.maxTermMonths = maxTermMonths;
        this.recruitEndsOn = recruitEndsOn;
        this.status = initialStatus;
        this.raisedAmount = 0L;
        this.totalPaid = 0L;
        this.investorPerk = investorPerk;
    }

    public void ensureRecruiting() {
        if (status != OfferingStatus.RECRUITING) {
            throw new BusinessException(ErrorCode.OFFERING_NOT_RECRUITING, "현재 상태: " + status.getLabel());
        }
    }

    public void acceptInvestment(long amount) {
        ensureRecruiting();
        if (amount > remainingAmount()) {
            throw new BusinessException(ErrorCode.EXCEEDS_REMAINING_AMOUNT,
                    String.format("남은 모집 금액: %,d원", remainingAmount()));
        }
        raisedAmount += amount;
        if (raisedAmount == targetAmount) {
            status = OfferingStatus.FUNDED;
        }
    }

    public void startPayout(YearMonth firstMonth) {
        if (status != OfferingStatus.FUNDED) {
            throw new IllegalStateException("모집이 끝난 상품만 지급을 시작할 수 있습니다.");
        }
        this.payoutStartMonth = firstMonth.atDay(1);
        this.status = OfferingStatus.ACTIVE;
    }

    public void ensureActive() {
        if (status != OfferingStatus.ACTIVE) {
            throw new BusinessException(ErrorCode.OFFERING_NOT_ACTIVE, "현재 상태: " + status.getLabel());
        }
    }

    public long remainingAmount() {
        return targetAmount - raisedAmount;
    }

    public long repaymentCap() {
        return BigDecimal.valueOf(raisedAmount).multiply(repaymentCapMultiple)
                .setScale(0, RoundingMode.DOWN).longValue();
    }

    public long remainingCap() {
        return Math.max(0L, repaymentCap() - totalPaid);
    }

    public long grossPayoutOf(long revenue) {
        return BigDecimal.valueOf(revenue).multiply(revenueShareRate)
                .setScale(0, RoundingMode.DOWN).longValue();
    }

    public YearMonth getPayoutStartYearMonth() {
        return payoutStartMonth == null ? null : YearMonth.from(payoutStartMonth);
    }

    public YearMonth getLastSettledYearMonth() {
        return lastSettledMonth == null ? null : YearMonth.from(lastSettledMonth);
    }

    /** 지급 시작 월을 1회차로 센 회차. */
    public int termIndexOf(YearMonth month) {
        return (int) ChronoUnit.MONTHS.between(getPayoutStartYearMonth(), month) + 1;
    }

    public YearMonth nextSettlementMonth(YearMonth lastSettledMonth) {
        return lastSettledMonth == null ? getPayoutStartYearMonth() : lastSettledMonth.plusMonths(1);
    }

    public void applyPayout(long amount, YearMonth month) {
        totalPaid += amount;
        lastSettledMonth = month.atDay(1);
        if (totalPaid >= repaymentCap() || termIndexOf(month) >= maxTermMonths) {
            status = OfferingStatus.COMPLETED;
        }
    }

    public double fundingRate() {
        return targetAmount == 0 ? 0.0 : (double) raisedAmount / targetAmount;
    }

    public double repaymentProgress() {
        long cap = repaymentCap();
        return cap == 0 ? 0.0 : (double) totalPaid / cap;
    }

    public Long getId() {
        return id;
    }

    public Store getStore() {
        return store;
    }

    public String getTitle() {
        return title;
    }

    public String getPurpose() {
        return purpose;
    }

    public long getTargetAmount() {
        return targetAmount;
    }

    public long getRaisedAmount() {
        return raisedAmount;
    }

    public BigDecimal getRevenueShareRate() {
        return revenueShareRate;
    }

    public BigDecimal getRepaymentCapMultiple() {
        return repaymentCapMultiple;
    }

    public int getMaxTermMonths() {
        return maxTermMonths;
    }

    public OfferingStatus getStatus() {
        return status;
    }

    public LocalDate getRecruitEndsOn() {
        return recruitEndsOn;
    }

    public String getInvestorPerk() {
        return investorPerk;
    }

    public long getTotalPaid() {
        return totalPaid;
    }
}
