package com.tablestake.investment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface InvestmentRepository extends JpaRepository<Investment, Long> {

    @Query("select coalesce(sum(i.amount), 0L) from Investment i "
            + "where i.offering.id = :offeringId and i.investor.id = :investorId")
    Long sumAmount(@Param("offeringId") Long offeringId, @Param("investorId") Long investorId);

    @Query("select count(distinct i.investor.id) from Investment i where i.offering.id = :offeringId")
    long countInvestors(@Param("offeringId") Long offeringId);

    @Query("select i from Investment i join fetch i.investor where i.offering.id = :offeringId order by i.id")
    List<Investment> findAllWithInvestorByOfferingId(@Param("offeringId") Long offeringId);

    @Query("select i from Investment i join fetch i.offering o join fetch o.store "
            + "where i.investor.id = :investorId order by i.id")
    List<Investment> findAllWithOfferingByInvestorId(@Param("investorId") Long investorId);
}
