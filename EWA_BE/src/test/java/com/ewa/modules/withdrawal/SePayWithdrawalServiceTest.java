package com.ewa.modules.withdrawal;

import com.ewa.common.config.WithdrawalProperties;
import com.ewa.common.entity.BankAccount;
import com.ewa.common.entity.Employee;
import com.ewa.common.entity.Employer;
import com.ewa.common.entity.PayoutAttempt;
import com.ewa.common.entity.PayrollPeriod;
import com.ewa.common.entity.Withdrawal;
import com.ewa.common.enums.BankAccountStatus;
import com.ewa.common.enums.PaymentProvider;
import com.ewa.common.enums.PayoutAttemptStatus;
import com.ewa.common.enums.PayrollPeriodStatus;
import com.ewa.common.enums.WithdrawalStatus;
import com.ewa.common.repository.BankAccountRepository;
import com.ewa.common.repository.EmployeeRepository;
import com.ewa.common.repository.PayoutAttemptRepository;
import com.ewa.common.repository.PayrollPeriodRepository;
import com.ewa.common.repository.WithdrawalRepository;
import com.ewa.modules.payment.AvailableLimitService;
import com.ewa.modules.payment.sepay.SePayClient;
import com.ewa.modules.payment.sepay.SePayClientException;
import com.ewa.modules.payment.sepay.dto.SePayTransferResponse;
import com.ewa.modules.withdrawal.dto.WithdrawalRequest;
import com.ewa.modules.withdrawal.dto.WithdrawalResponse;
import com.ewa.modules.withdrawal.impl.WithdrawalLedgerService;
import com.ewa.modules.withdrawal.impl.SePayWithdrawalServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("SePayWithdrawalService Unit Tests")
class SePayWithdrawalServiceTest {

    @Mock private EmployeeRepository employeeRepository;
    @Mock private BankAccountRepository bankAccountRepository;
    @Mock private WithdrawalRepository withdrawalRepository;
    @Mock private PayoutAttemptRepository payoutAttemptRepository;
    @Mock private PayrollPeriodRepository payrollPeriodRepository;
    @Mock private AvailableLimitService availableLimitService;
    @Mock private SePayClient sePayClient;
    @Mock private WithdrawalProperties withdrawalProperties;
    @Mock private WithdrawalLedgerService withdrawalLedgerService;

    @InjectMocks
    private SePayWithdrawalServiceImpl service;

    private static final String EMP_CODE = "NV001";
    private static final UUID EMP_ID = UUID.randomUUID();
    private static final UUID EMPLOYER_ID = UUID.randomUUID();
    private static final UUID BANK_ACCOUNT_ID = UUID.randomUUID();
    private static final UUID PERIOD_ID = UUID.randomUUID();
    private static final UUID WITHDRAWAL_ID = UUID.randomUUID();

    private Employee employee;
    private Employer employer;
    private BankAccount bankAccount;
    private PayrollPeriod payrollPeriod;
    private WithdrawalRequest request;

    @BeforeEach
    void setUp() {
        employer = new Employer();
        employer.setId(EMPLOYER_ID);

        employee = new Employee();
        employee.setId(EMP_ID);
        employee.setEmployeeCode(EMP_CODE);
        employee.setEmployer(employer);

        bankAccount = new BankAccount();
        bankAccount.setId(BANK_ACCOUNT_ID);
        bankAccount.setEmployee(employee);
        bankAccount.setBankCode("VCB");
        bankAccount.setAccountNoEncrypted("1234567890");
        bankAccount.setAccountNoLast4("7890");
        bankAccount.setAccountNameVerified("Nguyen Van A");
        bankAccount.setStatus(BankAccountStatus.VERIFIED);

        payrollPeriod = new PayrollPeriod();
        payrollPeriod.setId(PERIOD_ID);
        payrollPeriod.setStartDate(LocalDate.of(2025, 5, 1));
        payrollPeriod.setEndDate(LocalDate.of(2025, 5, 31));
        payrollPeriod.setStatus(PayrollPeriodStatus.OPEN);

        request = new WithdrawalRequest();
        request.setAmountVnd(1_000_000L);
        request.setBankAccountId(BANK_ACCOUNT_ID);
    }

    @Test
    @DisplayName("Success path (commitLedgerImmediately=true): should commit ledger + return SUCCESS immediately")
    void createWithdrawal_success_immediateCommit() {
        // Setup mocks
        when(employeeRepository.findByEmployeeCode(EMP_CODE)).thenReturn(Optional.of(employee));
        when(bankAccountRepository.findByIdAndEmployeeEmployeeCode(BANK_ACCOUNT_ID, EMP_CODE))
                .thenReturn(Optional.of(bankAccount));
        when(payrollPeriodRepository.findTopByEmployerIdAndStatusOrderByStartDateDesc(EMPLOYER_ID, PayrollPeriodStatus.OPEN))
                .thenReturn(Optional.of(payrollPeriod));
        when(availableLimitService.calculateAvailableLimit(EMP_CODE, PERIOD_ID))
                .thenReturn(5_000_000L);

        Withdrawal createdWithdrawal = buildWithdrawal(WithdrawalStatus.CREATED);
        Withdrawal successWithdrawal = buildWithdrawal(WithdrawalStatus.SUCCESS);
        when(withdrawalRepository.save(any()))
                .thenReturn(createdWithdrawal)
                .thenReturn(successWithdrawal);

        PayoutAttempt savedAttempt = new PayoutAttempt();
        savedAttempt.setId(UUID.randomUUID());
        savedAttempt.setStatus(PayoutAttemptStatus.INIT);
        when(payoutAttemptRepository.save(any())).thenReturn(savedAttempt);

        SePayTransferResponse sePayResponse = new SePayTransferResponse();
        sePayResponse.setTransactionId("MOCK-SEPAY-001");
        sePayResponse.setCode("00");
        sePayResponse.setStatus("PENDING");
        when(sePayClient.transfer(any())).thenReturn(sePayResponse);

        // commitLedgerImmediately = true → ledger written + SUCCESS
        when(withdrawalProperties.isCommitLedgerImmediately()).thenReturn(true);

        WithdrawalResponse response = service.createWithdrawal(request, EMP_CODE);

        assertThat(response.getStatus()).isEqualTo(WithdrawalStatus.SUCCESS);
        assertThat(response.getAmountVnd()).isEqualTo(1_000_000L);
        assertThat(response.getFeeVnd()).isEqualTo(10_000L);
        assertThat(response.getTotalDebitVnd()).isEqualTo(1_010_000L);
        assertThat(response.getMessage()).contains("thành công");
        verify(withdrawalLedgerService).writeAllEntries(any());
        verify(sePayClient).transfer(any());
    }

    @Test
    @DisplayName("Process path (commitLedgerImmediately=false): should NOT commit ledger, return PROCESSING")
    void createWithdrawal_processingPath_noImmediateCommit() {
        when(employeeRepository.findByEmployeeCode(EMP_CODE)).thenReturn(Optional.of(employee));
        when(bankAccountRepository.findByIdAndEmployeeEmployeeCode(BANK_ACCOUNT_ID, EMP_CODE))
                .thenReturn(Optional.of(bankAccount));
        when(payrollPeriodRepository.findTopByEmployerIdAndStatusOrderByStartDateDesc(EMPLOYER_ID, PayrollPeriodStatus.OPEN))
                .thenReturn(Optional.of(payrollPeriod));
        when(availableLimitService.calculateAvailableLimit(EMP_CODE, PERIOD_ID))
                .thenReturn(5_000_000L);

        Withdrawal createdWithdrawal = buildWithdrawal(WithdrawalStatus.CREATED);
        Withdrawal processingWithdrawal = buildWithdrawal(WithdrawalStatus.PROCESSING);
        when(withdrawalRepository.save(any()))
                .thenReturn(createdWithdrawal)
                .thenReturn(processingWithdrawal);

        PayoutAttempt savedAttempt = new PayoutAttempt();
        savedAttempt.setId(UUID.randomUUID());
        savedAttempt.setStatus(PayoutAttemptStatus.INIT);
        when(payoutAttemptRepository.save(any())).thenReturn(savedAttempt);

        SePayTransferResponse sePayResponse = new SePayTransferResponse();
        sePayResponse.setTransactionId("SEPAY-TXN-002");
        sePayResponse.setCode("00");
        sePayResponse.setStatus("PENDING");
        when(sePayClient.transfer(any())).thenReturn(sePayResponse);

        // commitLedgerImmediately = false → ledger NOT written, stays PROCESSING
        when(withdrawalProperties.isCommitLedgerImmediately()).thenReturn(false);

        WithdrawalResponse response = service.createWithdrawal(request, EMP_CODE);

        assertThat(response.getStatus()).isEqualTo(WithdrawalStatus.PROCESSING);
        assertThat(response.getMessage()).contains("đang xử lý");
        verify(withdrawalLedgerService, org.mockito.Mockito.never()).writeAllEntries(any());
    }

    @Test
    @DisplayName("Should throw when amount exceeds available limit")
    void createWithdrawal_insufficientLimit() {
        when(employeeRepository.findByEmployeeCode(EMP_CODE)).thenReturn(Optional.of(employee));
        when(bankAccountRepository.findByIdAndEmployeeEmployeeCode(BANK_ACCOUNT_ID, EMP_CODE))
                .thenReturn(Optional.of(bankAccount));
        when(payrollPeriodRepository.findTopByEmployerIdAndStatusOrderByStartDateDesc(EMPLOYER_ID, PayrollPeriodStatus.OPEN))
                .thenReturn(Optional.of(payrollPeriod));
        when(availableLimitService.calculateAvailableLimit(EMP_CODE, PERIOD_ID))
                .thenReturn(500_000L); // less than requested 1,000,000

        assertThatThrownBy(() -> service.createWithdrawal(request, EMP_CODE))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Số tiền vượt hạn mức");
    }

    @Test
    @DisplayName("Should mark withdrawal FAILED when SePay returns error")
    void createWithdrawal_sePayError_marksWithdrawalFailed() {
        when(employeeRepository.findByEmployeeCode(EMP_CODE)).thenReturn(Optional.of(employee));
        when(bankAccountRepository.findByIdAndEmployeeEmployeeCode(BANK_ACCOUNT_ID, EMP_CODE))
                .thenReturn(Optional.of(bankAccount));
        when(payrollPeriodRepository.findTopByEmployerIdAndStatusOrderByStartDateDesc(EMPLOYER_ID, PayrollPeriodStatus.OPEN))
                .thenReturn(Optional.of(payrollPeriod));
        when(availableLimitService.calculateAvailableLimit(EMP_CODE, PERIOD_ID))
                .thenReturn(5_000_000L);

        Withdrawal savedWithdrawal = buildWithdrawal(WithdrawalStatus.CREATED);
        when(withdrawalRepository.save(any())).thenReturn(savedWithdrawal);

        PayoutAttempt savedAttempt = new PayoutAttempt();
        savedAttempt.setId(UUID.randomUUID());
        savedAttempt.setStatus(PayoutAttemptStatus.INIT);
        when(payoutAttemptRepository.save(any())).thenReturn(savedAttempt);

        when(sePayClient.transfer(any())).thenThrow(new SePayClientException("Connection timeout"));

        assertThatThrownBy(() -> service.createWithdrawal(request, EMP_CODE))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("cổng thanh toán");

        // Verify attempt and withdrawal both marked FAILED (and INIT/CREATED initially)
        verify(payoutAttemptRepository, times(2)).save(any()); // INIT save, then FAILED save
        verify(withdrawalRepository, times(2)).save(any()); // CREATED save, then FAILED save
    }

    @Test
    @DisplayName("Should throw when bank account does not belong to employee")
    void createWithdrawal_bankAccountOwnershipViolation() {
        when(employeeRepository.findByEmployeeCode(EMP_CODE)).thenReturn(Optional.of(employee));
        when(bankAccountRepository.findByIdAndEmployeeEmployeeCode(BANK_ACCOUNT_ID, EMP_CODE))
                .thenReturn(Optional.empty()); // not found = ownership violation

        assertThatThrownBy(() -> service.createWithdrawal(request, EMP_CODE))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("không thuộc nhân viên này");
    }

    @Test
    @DisplayName("Should return withdrawal history ordered newest first")
    void getHistory_returnsOrderedList() {
        Withdrawal w1 = buildWithdrawal(WithdrawalStatus.SUCCESS);
        Withdrawal w2 = buildWithdrawal(WithdrawalStatus.PROCESSING);
        when(withdrawalRepository.findByEmployeeEmployeeCodeOrderByCreatedAtDesc(EMP_CODE))
                .thenReturn(List.of(w1, w2));
        when(payoutAttemptRepository.findTopByWithdrawalIdOrderByAttemptNoDesc(any()))
                .thenReturn(Optional.empty());

        List<WithdrawalResponse> history = service.getHistory(EMP_CODE);

        assertThat(history).hasSize(2);
        assertThat(history.get(0).getStatus()).isEqualTo(WithdrawalStatus.SUCCESS);
        assertThat(history.get(1).getStatus()).isEqualTo(WithdrawalStatus.PROCESSING);
    }

    // ─── helpers ────────────────────────────────────────────────────────────────

    private Withdrawal buildWithdrawal(WithdrawalStatus status) {
        Withdrawal w = new Withdrawal();
        w.setId(WITHDRAWAL_ID);
        w.setEmployee(employee);
        w.setEmployer(employer);
        w.setPayrollPeriod(payrollPeriod);
        w.setBankAccount(bankAccount);
        w.setAmountRequestedVnd(1_000_000L);
        w.setFeeVnd(10_000L); // <= 1M → 10k fee
        w.setTotalDebitVnd(1_010_000L);
        w.setNetAmountVnd(1_000_000L);
        w.setFeePolicyCode("STANDARD");
        w.setStatus(status);
        w.setIdempotencyKey("WD-" + EMP_CODE + "-test");
        return w;
    }
}
