package com.ewa.common.repository;

import com.ewa.common.entity.WorkEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkEntryRepository extends JpaRepository<WorkEntry, UUID> {
    @Query("select coalesce(sum(w.workedUnits), 0) from WorkEntry w where w.employee.id = :employeeId and w.payrollPeriod.id = :payrollPeriodId")
    BigDecimal sumWorkedUnitsByEmployeeAndPayrollPeriod(@Param("employeeId") UUID employeeId, @Param("payrollPeriodId") UUID payrollPeriodId);

    @Query("select coalesce(sum(w.earnedVnd), 0) from WorkEntry w where w.employee.id = :employeeId and w.payrollPeriod.id = :payrollPeriodId")
    Optional<Long> sumEarnedVndByEmployeeAndPayrollPeriod(@Param("employeeId") UUID employeeId, @Param("payrollPeriodId") UUID payrollPeriodId);
}
