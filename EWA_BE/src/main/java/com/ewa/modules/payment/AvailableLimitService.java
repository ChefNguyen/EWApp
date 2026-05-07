package com.ewa.modules.payment;

import com.ewa.common.entity.Employee;
import com.ewa.common.entity.PayPolicy;
import com.ewa.common.entity.PayrollPeriod;
import com.ewa.common.enums.LedgerEntryType;
import com.ewa.common.enums.PayrollPeriodStatus;
import com.ewa.common.repository.EmployeeRepository;
import com.ewa.common.repository.LedgerEntryRepository;
import com.ewa.common.repository.PayPolicyRepository;
import com.ewa.common.repository.PayrollPeriodRepository;
import com.ewa.common.repository.WorkEntryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AvailableLimitService {

    private static final long DEFAULT_ROUNDING_UNIT = 1000L;
    private static final Set<LedgerEntryType> USED_LIMIT_TYPES = EnumSet.of(
            LedgerEntryType.WITHDRAW_DEBIT,
            LedgerEntryType.FEE_DEBIT,
            LedgerEntryType.TOPUP_DEBIT,
            LedgerEntryType.BILL_DEBIT
    );

    private final EmployeeRepository employeeRepository;
    private final PayrollPeriodRepository payrollPeriodRepository;
    private final PayPolicyRepository payPolicyRepository;
    private final WorkEntryRepository workEntryRepository;
    private final LedgerEntryRepository ledgerEntryRepository;

    public long calculateAvailableLimit(String employeeCode) {
        Employee employee = employeeRepository.findByEmployeeCode(employeeCode)
                .orElseThrow(() -> new RuntimeException("Mã nhân viên không tồn tại"));

        PayrollPeriod payrollPeriod = payrollPeriodRepository
                .findTopByEmployerIdAndStatusOrderByStartDateDesc(employee.getEmployer().getId(), PayrollPeriodStatus.OPEN)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy kỳ lương đang mở"));

        return calculateAvailableLimit(employeeCode, payrollPeriod.getId());
    }

    public long calculateAvailableLimit(String employeeCode, UUID payrollPeriodId) {
        Employee employee = employeeRepository.findByEmployeeCode(employeeCode)
                .orElseThrow(() -> new RuntimeException("Mã nhân viên không tồn tại"));

        PayrollPeriod payrollPeriod = payrollPeriodRepository.findById(payrollPeriodId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy kỳ lương"));

        List<PayPolicy> effectivePolicies = payPolicyRepository
                .findByEmployerIdAndEffectiveFromLessThanEqualAndEffectiveToIsNullOrEffectiveToGreaterThanEqualOrderByEffectiveFromDesc(
                        employee.getEmployer().getId(),
                        payrollPeriod.getEndDate(),
                        payrollPeriod.getStartDate()
                );

        if (effectivePolicies.isEmpty()) {
            throw new RuntimeException("Chưa cấu hình chính sách lương cho doanh nghiệp");
        }

        PayPolicy policy = effectivePolicies.get(0);

        long earnedAmount = calculateEarnedAmount(employee.getId(), payrollPeriod.getId(), policy);

        long totalUsed = ledgerEntryRepository
                .sumAmountVndByEmployeeAndPayrollPeriodAndTypes(employee.getId(), payrollPeriod.getId(), USED_LIMIT_TYPES)
                .orElse(0L);

        long rawAvailable = earnedAmount - totalUsed;
        if (rawAvailable <= 0) {
            return 0L;
        }

        long roundingUnit = policy.getRoundingUnitVnd() > 0 ? policy.getRoundingUnitVnd() : DEFAULT_ROUNDING_UNIT;
        return (rawAvailable / roundingUnit) * roundingUnit;
    }

    private long calculateEarnedAmount(UUID employeeId, UUID payrollPeriodId, PayPolicy policy) {
        long totalEarned = workEntryRepository.sumEarnedVndByEmployeeAndPayrollPeriod(employeeId, payrollPeriodId).orElse(0L);
        if (totalEarned > 0) {
            return (totalEarned * policy.getLimitPercent()) / 100L;
        }

        BigDecimal workedUnits = workEntryRepository.sumWorkedUnitsByEmployeeAndPayrollPeriod(employeeId, payrollPeriodId);
        if (workedUnits == null || workedUnits.compareTo(BigDecimal.ZERO) <= 0) {
            return 0L;
        }

        long grossSalary = estimateGrossSalaryFromPolicy(policy);
        long dailyRate = grossSalary / Math.max(1, policy.getStandardUnits());
        long earned = workedUnits.longValue() * dailyRate;
        return (earned * policy.getLimitPercent()) / 100L;
    }

    private long estimateGrossSalaryFromPolicy(PayPolicy policy) {
        long standardUnits = Math.max(1, policy.getStandardUnits());
        return standardUnits * 1_000_000L;
    }
}
