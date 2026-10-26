package com.tablestake.investment;

import com.tablestake.offering.Offering;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "investment", indexes = {
        @Index(name = "idx_investment_offering", columnList = "offering_id"),
        @Index(name = "idx_investment_investor", columnList = "investor_id")
})
public class Investment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "offering_id", nullable = false)
    private Offering offering;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "investor_id", nullable = false)
    private Investor investor;

    @Column(nullable = false)
    private long amount;

    /** 지금까지 받은 지급액 합계. 정산할 때마다 늘어난다. */
    @Column(nullable = false)
    private long receivedAmount;

    @Column(nullable = false)
    private LocalDateTime investedAt;

    protected Investment() {
    }

    public Investment(Offering offering, Investor investor, long amount, LocalDateTime investedAt) {
        this.offering = offering;
        this.investor = investor;
        this.amount = amount;
        this.investedAt = investedAt;
        this.receivedAmount = 0L;
    }

    public void receive(long payout) {
        if (payout < 0) {
            throw new IllegalArgumentException("지급액은 0원 이상이어야 합니다.");
        }
        receivedAmount += payout;
    }

    public Long getId() {
        return id;
    }

    public Offering getOffering() {
        return offering;
    }

    public Investor getInvestor() {
        return investor;
    }

    public long getAmount() {
        return amount;
    }

    public long getReceivedAmount() {
        return receivedAmount;
    }

    public LocalDateTime getInvestedAt() {
        return investedAt;
    }
}
