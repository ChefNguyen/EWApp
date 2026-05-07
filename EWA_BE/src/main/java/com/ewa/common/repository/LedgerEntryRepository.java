package com.ewa.common.repository;

import com.ewa.common.entity.LedgerEntry;
import com.ewa.common.enums.LedgerEntryType;
import com.ewa.common.enums.LedgerReferenceType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LedgerEntryRepository extends JpaRepository<LedgerEntry, UUID> {

    @Query("select coalesce(sum(le.amountVnd), 0) from LedgerEntry le where le.employee.id = :employeeId and le.payrollPeriod.id = :payrollPeriodId and le.entryType in :types")
    Optional<Long> sumAmountVndByEmployeeAndPayrollPeriodAndTypes(
            @Param("employeeId") UUID employeeId,
            @Param("payrollPeriodId") UUID payrollPeriodId,
            @Param("types") Collection<LedgerEntryType> types
    );

    /**
     * Idempotency guard – checks if a ledger entry already exists for the given
     * type + referenceType + referenceId combination before writing a new one.
     */
    boolean existsByEntryTypeAndReferenceTypeAndReferenceId(
            LedgerEntryType entryType,
            LedgerReferenceType referenceType,
            UUID referenceId
    );
}
