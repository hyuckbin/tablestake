package com.tablestake.store;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface MonthlyRevenueRepository extends JpaRepository<MonthlyRevenue, Long> {

    List<MonthlyRevenue> findByStoreIdOrderByRevenueMonthAsc(Long storeId);

    Optional<MonthlyRevenue> findByStoreIdAndRevenueMonth(Long storeId, LocalDate revenueMonth);

    boolean existsByStoreIdAndRevenueMonth(Long storeId, LocalDate revenueMonth);

    Optional<MonthlyRevenue> findFirstByStoreIdOrderByRevenueMonthDesc(Long storeId);
}
