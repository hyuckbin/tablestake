package com.tablestake.settlement;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface SettlementRepository extends JpaRepository<Settlement, Long> {

    boolean existsByOfferingIdAndSettlementMonth(Long offeringId, LocalDate settlementMonth);

    Optional<Settlement> findFirstByOfferingIdOrderBySettlementMonthDesc(Long offeringId);

    List<Settlement> findByOfferingIdOrderBySettlementMonthDesc(Long offeringId);

    @Query("select s from Settlement s join fetch s.offering o join fetch o.store where s.id = :id")
    Optional<Settlement> findWithOfferingById(@Param("id") Long id);
}
