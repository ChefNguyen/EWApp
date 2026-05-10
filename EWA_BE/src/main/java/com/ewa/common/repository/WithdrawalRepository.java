package com.ewa.common.repository;

import com.ewa.common.entity.Withdrawal;
import com.ewa.common.enums.WithdrawalStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Repository
public interface WithdrawalRepository extends JpaRepository<Withdrawal, UUID> {
    Optional<Withdrawal> findByIdAndEmployeeEmployeeCode(UUID id, String employeeCode);

    List<Withdrawal> findByEmployeeEmployeeCodeOrderByCreatedAtDesc(String employeeCode);

    /**
     * Sums totalDebitVnd of all pending withdrawals (CREATED or PROCESSING)
     * for an employee within a payroll period. Used by AvailableLimitService
     * to hold limit immediately when a withdrawal is created, rather than
     * waiting for webhook success.
     */
    @Query("select coalesce(sum(w.totalDebitVnd), 0) from Withdrawal w " +
           "where w.employee.id = :employeeId " +
           "and w.payrollPeriod.id = :payrollPeriodId " +
           "and w.status in :statuses")
    long sumPendingWithdrawalDebits(
            @Param("employeeId") UUID employeeId,
            @Param("payrollPeriodId") UUID payrollPeriodId,
            @Param("statuses") Set<WithdrawalStatus> statuses
    );
}
