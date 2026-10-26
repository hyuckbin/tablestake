package com.tablestake.settlement;

import com.tablestake.investment.Investment;
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

/**
 * 정산 한 건에서 투자 한 건이 받은 금액.
 */
@Entity
@Table(name = "payout", indexes = {
        @Index(name = "idx_payout_settlement", columnList = "settlement_id"),
        @Index(name = "idx_payout_investment", columnList = "investment_id")
})
public class Payout {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "settlement_id", nullable = false)
    private Settlement settlement;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "investment_id", nullable = false)
    private Investment investment;

    @Column(nullable = false)
    private long amount;

    protected Payout() {
    }

    public Payout(Settlement settlement, Investment investment, long amount) {
        this.settlement = settlement;
        this.investment = investment;
        this.amount = amount;
    }

    public Long getId() {
        return id;
    }

    public Settlement getSettlement() {
        return settlement;
    }

    public Investment getInvestment() {
        return investment;
    }

    public long getAmount() {
        return amount;
    }
}
