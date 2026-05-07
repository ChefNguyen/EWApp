package com.ewa.modules.utility;

import com.ewa.common.entity.Employee;
import com.ewa.common.entity.Employer;
import com.ewa.common.entity.LedgerEntry;
import com.ewa.common.entity.PayrollPeriod;
import com.ewa.common.enums.PayrollPeriodStatus;
import com.ewa.common.repository.EmployeeRepository;
import com.ewa.common.repository.LedgerEntryRepository;
import com.ewa.common.repository.PayrollPeriodRepository;
import com.ewa.modules.payment.AvailableLimitService;
import com.ewa.modules.utility.dto.BillPayRequest;
import com.ewa.modules.utility.dto.BillPayResponse;
import com.ewa.modules.utility.dto.BillQueryRequest;
import com.ewa.modules.utility.dto.BillQueryResponse;
import com.ewa.modules.utility.dto.TopupRequest;
import com.ewa.modules.utility.dto.TopupResponse;
import com.ewa.modules.utility.impl.MockPayooServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("MockPayooService Unit Tests")
class MockPayooServiceTest {

    @Mock private EmployeeRepository employeeRepository;
    @Mock private PayrollPeriodRepository payrollPeriodRepository;
    @Mock private LedgerEntryRepository ledgerEntryRepository;
    @Mock private AvailableLimitService availableLimitService;
    @Mock private MockDataStore mockDataStore;

    @InjectMocks
    private MockPayooServiceImpl service;

    private static final String EMP_CODE = "NV001";
    private static final UUID EMP_ID = UUID.randomUUID();
    private static final UUID EMPLOYER_ID = UUID.randomUUID();

    private Employee employee;
    private PayrollPeriod payrollPeriod;

    @BeforeEach
    void setUp() {
        Employer employer = new Employer();
        employer.setId(EMPLOYER_ID);

        employee = new Employee();
        employee.setId(EMP_ID);
        employee.setEmployeeCode(EMP_CODE);
        employee.setEmployer(employer);

        payrollPeriod = new PayrollPeriod();
        payrollPeriod.setId(UUID.randomUUID());
        payrollPeriod.setStartDate(LocalDate.of(2025, 5, 1));
        payrollPeriod.setEndDate(LocalDate.of(2025, 5, 31));
        payrollPeriod.setStatus(PayrollPeriodStatus.OPEN);

        // Inject no-op delay for tests (deterministic)
        ReflectionTestUtils.invokeSetterMethod(service, "setDelayProvider", (java.util.function.LongSupplier) () -> 0L);
        // Inject no-fail random for success tests
        ReflectionTestUtils.invokeSetterMethod(service, "setRandomSupplier", (java.util.function.Supplier<Double>) () -> 0.99);
        ReflectionTestUtils.setField(service, "failureRate", 0.05);
    }

    // ─── Topup tests ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("Topup success: should write TOPUP_DEBIT ledger entry and return new limit")
    void topup_success() {
        when(employeeRepository.findByEmployeeCode(EMP_CODE)).thenReturn(Optional.of(employee));
        when(mockDataStore.isValidDenomination(100_000L)).thenReturn(true);
        when(mockDataStore.detectCarrier("0321234567")).thenReturn("Viettel");
        when(availableLimitService.calculateAvailableLimit(EMP_CODE)).thenReturn(500_000L);
        when(payrollPeriodRepository.findTopByEmployerIdAndStatusOrderByStartDateDesc(EMPLOYER_ID, PayrollPeriodStatus.OPEN))
                .thenReturn(Optional.of(payrollPeriod));
        when(ledgerEntryRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(availableLimitService.calculateAvailableLimit(EMP_CODE)).thenReturn(500_000L, 400_000L); // before, after

        TopupRequest request = new TopupRequest();
        request.setEmployeeCode(EMP_CODE);
        request.setPhoneNumber("0321234567");
        request.setDenomination(100_000L);

        TopupResponse response = service.topupPhone(request);

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getTransactionId()).startsWith("TOPUP-");
        assertThat(response.getNewLimit()).isEqualTo(400_000L);
        verify(ledgerEntryRepository).save(any(LedgerEntry.class));
    }

    @Test
    @DisplayName("Topup fail: should return error when limit insufficient")
    void topup_overLimit() {
        when(employeeRepository.findByEmployeeCode(EMP_CODE)).thenReturn(Optional.of(employee));
        when(mockDataStore.isValidDenomination(500_000L)).thenReturn(true);
        when(mockDataStore.detectCarrier("0321234567")).thenReturn("Viettel");
        when(availableLimitService.calculateAvailableLimit(EMP_CODE)).thenReturn(100_000L); // not enough

        TopupRequest request = new TopupRequest();
        request.setEmployeeCode(EMP_CODE);
        request.setPhoneNumber("0321234567");
        request.setDenomination(500_000L);

        TopupResponse response = service.topupPhone(request);

        assertThat(response.isSuccess()).isFalse();
        assertThat(response.getError()).contains("Hạn mức không đủ");
        verify(ledgerEntryRepository, never()).save(any());
    }

    @Test
    @DisplayName("Topup fail: invalid phone number prefix")
    void topup_invalidPhone() {
        when(employeeRepository.findByEmployeeCode(EMP_CODE)).thenReturn(Optional.of(employee));
        when(mockDataStore.isValidDenomination(50_000L)).thenReturn(true);
        when(mockDataStore.detectCarrier("0111234567")).thenReturn("Unknown");

        TopupRequest request = new TopupRequest();
        request.setEmployeeCode(EMP_CODE);
        request.setPhoneNumber("0111234567");
        request.setDenomination(50_000L);

        TopupResponse response = service.topupPhone(request);

        assertThat(response.isSuccess()).isFalse();
        assertThat(response.getError()).contains("Đầu số");
        verify(ledgerEntryRepository, never()).save(any());
    }

    @Test
    @DisplayName("Topup fail: simulated random failure from mock provider")
    void topup_simulatedRandomFailure() {
        // Force random to always fail
        ReflectionTestUtils.invokeSetterMethod(service, "setRandomSupplier",
                (java.util.function.Supplier<Double>) () -> 0.0);

        when(employeeRepository.findByEmployeeCode(EMP_CODE)).thenReturn(Optional.of(employee));
        when(mockDataStore.isValidDenomination(50_000L)).thenReturn(true);
        when(mockDataStore.detectCarrier("0321234567")).thenReturn("Viettel");
        when(availableLimitService.calculateAvailableLimit(EMP_CODE)).thenReturn(500_000L);

        TopupRequest request = new TopupRequest();
        request.setEmployeeCode(EMP_CODE);
        request.setPhoneNumber("0321234567");
        request.setDenomination(50_000L);

        TopupResponse response = service.topupPhone(request);

        assertThat(response.isSuccess()).isFalse();
        assertThat(response.getError()).contains("nhà mạng");
        verify(ledgerEntryRepository, never()).save(any());
    }

    // ─── Bill query tests ─────────────────────────────────────────────────────

    @Test
    @DisplayName("Query bill: found returns bill details")
    void queryBill_found() {
        MockDataStore.BillRecord bill = new MockDataStore.BillRecord(
                "ELEC-001", "electricity", "EVN001",
                "Nguyen Van A", "123 Le Loi", 350_000L, "05/2025", "UNPAID");

        when(mockDataStore.getBills()).thenReturn(java.util.Map.of("ELEC-001", bill));
        when(mockDataStore.isBillPaid("ELEC-001")).thenReturn(false);

        BillQueryRequest request = new BillQueryRequest();
        request.setServiceType("electricity");
        request.setCustomerId("EVN001");

        BillQueryResponse response = service.queryBill(request);

        assertThat(response.getBillKey()).isEqualTo("ELEC-001");
        assertThat(response.getAmount()).isEqualTo(350_000L);
        assertThat(response.getStatus()).isEqualTo("UNPAID");
        assertThat(response.getError()).isNull();
    }

    @Test
    @DisplayName("Query bill: not found returns error")
    void queryBill_notFound() {
        when(mockDataStore.getBills()).thenReturn(java.util.Map.of());

        BillQueryRequest request = new BillQueryRequest();
        request.setServiceType("electricity");
        request.setCustomerId("NONEXISTENT");

        BillQueryResponse response = service.queryBill(request);

        assertThat(response.getError()).contains("Không tìm thấy hóa đơn");
    }

    @Test
    @DisplayName("Query bill: already paid shows PAID status")
    void queryBill_alreadyPaidShowsPaidStatus() {
        MockDataStore.BillRecord bill = new MockDataStore.BillRecord(
                "ELEC-001", "electricity", "EVN001",
                "Nguyen Van A", "123 Le Loi", 350_000L, "05/2025", "UNPAID");

        when(mockDataStore.getBills()).thenReturn(java.util.Map.of("ELEC-001", bill));
        when(mockDataStore.isBillPaid("ELEC-001")).thenReturn(true); // already paid

        BillQueryRequest request = new BillQueryRequest();
        request.setServiceType("electricity");
        request.setCustomerId("EVN001");

        BillQueryResponse response = service.queryBill(request);

        assertThat(response.getStatus()).isEqualTo("PAID");
    }

    // ─── Bill pay tests ───────────────────────────────────────────────────────

    @Test
    @DisplayName("Pay bill success: should write BILL_DEBIT and return new limit")
    void payBill_success() {
        MockDataStore.BillRecord bill = new MockDataStore.BillRecord(
                "ELEC-001", "electricity", "EVN001",
                "Nguyen Van A", "123 Le Loi", 350_000L, "05/2025", "UNPAID");

        when(employeeRepository.findByEmployeeCode(EMP_CODE)).thenReturn(Optional.of(employee));
        when(mockDataStore.getBills()).thenReturn(java.util.Map.of("ELEC-001", bill));
        when(mockDataStore.isBillPaid("ELEC-001")).thenReturn(false);
        when(availableLimitService.calculateAvailableLimit(EMP_CODE)).thenReturn(500_000L, 150_000L);
        when(payrollPeriodRepository.findTopByEmployerIdAndStatusOrderByStartDateDesc(EMPLOYER_ID, PayrollPeriodStatus.OPEN))
                .thenReturn(Optional.of(payrollPeriod));
        when(ledgerEntryRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        BillPayRequest request = new BillPayRequest();
        request.setEmployeeCode(EMP_CODE);
        request.setBillKey("ELEC-001");

        BillPayResponse response = service.payBill(request);

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getTransactionId()).startsWith("BILL-");
        assertThat(response.getNewLimit()).isEqualTo(150_000L);
        verify(mockDataStore).markBillPaid("ELEC-001");
        verify(ledgerEntryRepository).save(any(LedgerEntry.class));
    }

    @Test
    @DisplayName("Pay bill fail: duplicate payment returns error")
    void payBill_duplicatePayment() {
        MockDataStore.BillRecord bill = new MockDataStore.BillRecord(
                "ELEC-001", "electricity", "EVN001",
                "Nguyen Van A", "123 Le Loi", 350_000L, "05/2025", "PAID");

        when(employeeRepository.findByEmployeeCode(EMP_CODE)).thenReturn(Optional.of(employee));
        when(mockDataStore.getBills()).thenReturn(java.util.Map.of("ELEC-001", bill));
        when(mockDataStore.isBillPaid("ELEC-001")).thenReturn(true); // already paid

        BillPayRequest request = new BillPayRequest();
        request.setEmployeeCode(EMP_CODE);
        request.setBillKey("ELEC-001");

        BillPayResponse response = service.payBill(request);

        assertThat(response.isSuccess()).isFalse();
        assertThat(response.getError()).contains("đã được thanh toán");
        verify(ledgerEntryRepository, never()).save(any());
        verify(mockDataStore, never()).markBillPaid(any());
    }

    @Test
    @DisplayName("Pay bill fail: limit insufficient")
    void payBill_insufficientLimit() {
        MockDataStore.BillRecord bill = new MockDataStore.BillRecord(
                "ELEC-001", "electricity", "EVN001",
                "Nguyen Van A", "123 Le Loi", 350_000L, "05/2025", "UNPAID");

        when(employeeRepository.findByEmployeeCode(EMP_CODE)).thenReturn(Optional.of(employee));
        when(mockDataStore.getBills()).thenReturn(java.util.Map.of("ELEC-001", bill));
        when(mockDataStore.isBillPaid("ELEC-001")).thenReturn(false);
        when(availableLimitService.calculateAvailableLimit(EMP_CODE)).thenReturn(100_000L); // not enough

        BillPayRequest request = new BillPayRequest();
        request.setEmployeeCode(EMP_CODE);
        request.setBillKey("ELEC-001");

        BillPayResponse response = service.payBill(request);

        assertThat(response.isSuccess()).isFalse();
        assertThat(response.getError()).contains("Hạn mức không đủ");
        verify(ledgerEntryRepository, never()).save(any());
    }
}
