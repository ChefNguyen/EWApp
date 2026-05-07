package com.ewa.common.repository;

import com.ewa.common.entity.PayrollPeriod;
import com.ewa.common.enums.PayrollPeriodStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PayrollPeriodRepository extends JpaRepository<PayrollPeriod, UUID> {
    Optional<PayrollPeriod> findTopByEmployerIdAndStatusOrderByStartDateDesc(UUID employerId, PayrollPeriodStatus status);
}
