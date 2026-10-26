package com.tablestake.investment;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface InvestorRepository extends JpaRepository<Investor, Long> {

    Optional<Investor> findFirstByDemoUserTrue();
}
