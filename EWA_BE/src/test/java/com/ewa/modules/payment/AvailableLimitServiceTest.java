package com.ewa.modules.payment;

import com.ewa.common.entity.Employee;
import com.ewa.common.entity.Employer;
import com.ewa.common.entity.PayPolicy;
import com.ewa.common.entity.PayrollPeriod;
import com.ewa.common.enums.LedgerEntryType;
import com.ewa.common.enums.PayrollPeriodStatus;
import com.ewa.common.enums.WorkUnitType;
import com.ewa.common.repository.EmployeeRepository;
import com.ewa.common.repository.LedgerEntryRepository;
import com.ewa.common.repository.PayPolicyRepository;
import com.ewa.common.repository.PayrollPeriodRepository;
import com.ewa.common.repository.WorkEntryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.EnumSet;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("AvailableLimitService Unit Tests")
class AvailableLimitServiceTest {

    @Mock private EmployeeRepository employeeRepository;
    @Mock private PayrollPeriodRepository payrollPeriodRepository;
    @Mock private PayPolicyRepository payPolicyRepository;
    @Mock private WorkEntryRepository workEntryRepository;
    @Mock private LedgerEntryRepository ledgerEntryRepository;

    @InjectMocks
    private AvailableLimitService service;

    private static final String EMP_CODE = "NV001";
    private static final UUID EMP_ID = UUID.randomUUID();
    private static final UUID EMPLOYER_ID = UUID.randomUUID();
    private static final UUID PERIOD_ID = UUID.randomUUID();

    private Employee employee;
    private Employer employer;
    private PayrollPeriod payrollPeriod;
    private PayPolicy policy;

    @BeforeEach
    void setUp() {
        employer = new Employer();
        employer.setId(EMPLOYER_ID);

        employee = new Employee();
        employee.setId(EMP_ID);
        employee.setEmployeeCode(EMP_CODE);
        employee.setEmployer(employer);

        payrollPeriod = new PayrollPeriod();
        payrollPeriod.setId(PERIOD_ID);
        payrollPeriod.setStartDate(LocalDate.of(2025, 5, 1));
        payrollPeriod.setEndDate(LocalDate.of(2025, 5, 31));
        payrollPeriod.setStatus(PayrollPeriodStatus.OPEN);

        policy = new PayPolicy();
        policy.setLimitPercent(80);
        policy.setStandardUnits(26);
        policy.setWorkUnitType(WorkUnitType.DAY);
        policy.setRoundingUnitVnd(1000L);
    }

    @Test
    @DisplayName("Should compute available limit correctly from earnedVnd + 80% cap + rounding")
    void calculateLimit_fromEarnedVnd() {
        // 10,000,000 earned × 80% = 8,000,000; used = 1,500,000; raw = 6,500,000; rounds to 6,500,000
        when(employeeRepository.findByEmployeeCode(EMP_CODE)).thenReturn(Optional.of(employee));
        when(payrollPeriodRepository.findById(PERIOD_ID)).thenReturn(Optional.of(payrollPeriod));
        when(payPolicyRepository.findByEmployerIdAndEffectiveFromLessThanEqualAndEffectiveToIsNullOrEffectiveToGreaterThanEqualOrderByEffectiveFromDesc(
                eq(EMPLOYER_ID), any(), any())).thenReturn(List.of(policy));
        when(workEntryRepository.sumEarnedVndByEmployeeAndPayrollPeriod(EMP_ID, PERIOD_ID))
                .thenReturn(Optional.of(10_000_000L));
        when(ledgerEntryRepository.sumAmountVndByEmployeeAndPayrollPeriodAndTypes(
                eq(EMP_ID), eq(PERIOD_ID), any()))
                .thenReturn(Optional.of(1_500_000L));

        long result = service.calculateAvailableLimit(EMP_CODE, PERIOD_ID);

        // 10,000,000 × 80% = 8,000,000 – 1,500,000 = 6,500,000 → already multiple of 1000
        assertThat(result).isEqualTo(6_500_000L);
    }

    @Test
    @DisplayName("Should round down to nearest 1000")
    void calculateLimit_roundingDown() {
        when(employeeRepository.findByEmployeeCode(EMP_CODE)).thenReturn(Optional.of(employee));
        when(payrollPeriodRepository.findById(PERIOD_ID)).thenReturn(Optional.of(payrollPeriod));
        when(payPolicyRepository.findByEmployerIdAndEffectiveFromLessThanEqualAndEffectiveToIsNullOrEffectiveToGreaterThanEqualOrderByEffectiveFromDesc(
                eq(EMPLOYER_ID), any(), any())).thenReturn(List.of(policy));
        when(workEntryRepository.sumEarnedVndByEmployeeAndPayrollPeriod(EMP_ID, PERIOD_ID))
                .thenReturn(Optional.of(3_001L)); // 3001 × 80% = 2400 (rounds down to 2000)
        when(ledgerEntryRepository.sumAmountVndByEmployeeAndPayrollPeriodAndTypes(
                eq(EMP_ID), eq(PERIOD_ID), any()))
                .thenReturn(Optional.of(0L));

        long result = service.calculateAvailableLimit(EMP_CODE, PERIOD_ID);

        // 3001 × 80% = 2400 → floor to 2000
        assertThat(result).isEqualTo(2000L);
    }

    @Test
    @DisplayName("Should return 0 when all limit is used")
    void calculateLimit_zeroWhenFullyUsed() {
        when(employeeRepository.findByEmployeeCode(EMP_CODE)).thenReturn(Optional.of(employee));
        when(payrollPeriodRepository.findById(PERIOD_ID)).thenReturn(Optional.of(payrollPeriod));
        when(payPolicyRepository.findByEmployerIdAndEffectiveFromLessThanEqualAndEffectiveToIsNullOrEffectiveToGreaterThanEqualOrderByEffectiveFromDesc(
                eq(EMPLOYER_ID), any(), any())).thenReturn(List.of(policy));
        when(workEntryRepository.sumEarnedVndByEmployeeAndPayrollPeriod(EMP_ID, PERIOD_ID))
                .thenReturn(Optional.of(5_000_000L));
        // used = 4,000,000 (= 5M × 80%); nothing left
        when(ledgerEntryRepository.sumAmountVndByEmployeeAndPayrollPeriodAndTypes(
                eq(EMP_ID), eq(PERIOD_ID), any()))
                .thenReturn(Optional.of(4_000_000L));

        long result = service.calculateAvailableLimit(EMP_CODE, PERIOD_ID);

        assertThat(result).isZero();
    }

    @Test
    @DisplayName("Should include all 4 debit types in used calculation")
    void calculateLimit_sumAllDebitTypes() {
        when(employeeRepository.findByEmployeeCode(EMP_CODE)).thenReturn(Optional.of(employee));
        when(payrollPeriodRepository.findById(PERIOD_ID)).thenReturn(Optional.of(payrollPeriod));
        when(payPolicyRepository.findByEmployerIdAndEffectiveFromLessThanEqualAndEffectiveToIsNullOrEffectiveToGreaterThanEqualOrderByEffectiveFromDesc(
                eq(EMPLOYER_ID), any(), any())).thenReturn(List.of(policy));
        when(workEntryRepository.sumEarnedVndByEmployeeAndPayrollPeriod(EMP_ID, PERIOD_ID))
                .thenReturn(Optional.of(10_000_000L));

        // Ensure the 4 debit types are aggregated: WITHDRAW_DEBIT+FEE_DEBIT+TOPUP_DEBIT+BILL_DEBIT
        EnumSet<LedgerEntryType> expectedTypes = EnumSet.of(
                LedgerEntryType.WITHDRAW_DEBIT, LedgerEntryType.FEE_DEBIT,
                LedgerEntryType.TOPUP_DEBIT, LedgerEntryType.BILL_DEBIT);
        when(ledgerEntryRepository.sumAmountVndByEmployeeAndPayrollPeriodAndTypes(
                eq(EMP_ID), eq(PERIOD_ID), any()))
                .thenReturn(Optional.of(500_000L + 1_000L + 100_000L + 200_000L)); // sum of all 4

        long result = service.calculateAvailableLimit(EMP_CODE, PERIOD_ID);

        // 10M × 80% = 8M – 801K = 7,199,000 → floor = 7,199,000
        assertThat(result).isEqualTo(7_199_000L);
    }

    @Test
    @DisplayName("Should throw when employee not found")
    void calculateLimit_throwsOnUnknownEmployee() {
        when(employeeRepository.findByEmployeeCode("UNKNOWN")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.calculateAvailableLimit("UNKNOWN", PERIOD_ID))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("không tồn tại");
    }

    @Test
    @DisplayName("Should throw when no active pay policy")
    void calculateLimit_throwsWhenNoPolicyConfigured() {
        when(employeeRepository.findByEmployeeCode(EMP_CODE)).thenReturn(Optional.of(employee));
        when(payrollPeriodRepository.findById(PERIOD_ID)).thenReturn(Optional.of(payrollPeriod));
        when(payPolicyRepository.findByEmployerIdAndEffectiveFromLessThanEqualAndEffectiveToIsNullOrEffectiveToGreaterThanEqualOrderByEffectiveFromDesc(
                eq(EMPLOYER_ID), any(), any())).thenReturn(List.of());

        assertThatThrownBy(() -> service.calculateAvailableLimit(EMP_CODE, PERIOD_ID))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("chính sách lương");
    }

    @Test
    @DisplayName("Should fallback to worked-units calculation when earnedVnd is 0")
    void calculateLimit_fallbackToWorkedUnits() {
        policy.setStandardUnits(26);
        policy.setLimitPercent(80);
        policy.setRoundingUnitVnd(1000L);

        when(employeeRepository.findByEmployeeCode(EMP_CODE)).thenReturn(Optional.of(employee));
        when(payrollPeriodRepository.findById(PERIOD_ID)).thenReturn(Optional.of(payrollPeriod));
        when(payPolicyRepository.findByEmployerIdAndEffectiveFromLessThanEqualAndEffectiveToIsNullOrEffectiveToGreaterThanEqualOrderByEffectiveFromDesc(
                eq(EMPLOYER_ID), any(), any())).thenReturn(List.of(policy));
        when(workEntryRepository.sumEarnedVndByEmployeeAndPayrollPeriod(EMP_ID, PERIOD_ID))
                .thenReturn(Optional.of(0L)); // triggers fallback
        when(workEntryRepository.sumWorkedUnitsByEmployeeAndPayrollPeriod(EMP_ID, PERIOD_ID))
                .thenReturn(new BigDecimal("13")); // 13 days out of 26
        when(ledgerEntryRepository.sumAmountVndByEmployeeAndPayrollPeriodAndTypes(
                eq(EMP_ID), eq(PERIOD_ID), any()))
                .thenReturn(Optional.of(0L));

        long result = service.calculateAvailableLimit(EMP_CODE, PERIOD_ID);

        // dailyRate = 26 * 1,000,000 / 26 = 1,000,000; 13 days * 1M = 13M; 80% = 10,400,000
        assertThat(result).isEqualTo(10_400_000L);
    }
}
