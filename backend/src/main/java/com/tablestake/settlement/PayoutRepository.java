package com.tablestake.settlement;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PayoutRepository extends JpaRepository<Payout, Long> {

    @Query("select p from Payout p join fetch p.investment i join fetch i.investor "
            + "where p.settlement.id = :settlementId order by p.amount desc, p.id asc")
    List<Payout> findAllWithInvestorBySettlementId(@Param("settlementId") Long settlementId);

    @Query("select p from Payout p join fetch p.settlement s join fetch s.offering o join fetch o.store "
            + "where p.investment.investor.id = :investorId order by s.settlementMonth desc, p.id desc")
    List<Payout> findAllWithSettlementByInvestorId(@Param("investorId") Long investorId);
}
