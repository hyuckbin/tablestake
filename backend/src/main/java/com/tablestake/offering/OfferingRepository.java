package com.tablestake.offering;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface OfferingRepository extends JpaRepository<Offering, Long> {

    /** 목록 조회 시 가게를 함께 가져와 N+1 조회를 막는다. */
    @Query("select o from Offering o join fetch o.store where o.status in :statuses order by o.id")
    List<Offering> findAllWithStoreByStatusIn(@Param("statuses") Collection<OfferingStatus> statuses);

    @Query("select o from Offering o join fetch o.store where o.id = :id")
    Optional<Offering> findWithStoreById(@Param("id") Long id);

    /**
     * 투자·정산처럼 모집액과 지급액을 바꾸는 작업은 상품 행에 쓰기 잠금을 건다.
     * 동시에 들어온 투자가 모집 목표를 넘기거나, 같은 달이 두 번 정산되는 일을 막는다.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select o from Offering o where o.id = :id")
    Optional<Offering> findByIdForUpdate(@Param("id") Long id);

    List<Offering> findByStoreIdOrderByIdAsc(Long storeId);
}
