package com.ewa.modules.webhook;

import com.ewa.common.entity.BankAccount;
import com.ewa.common.entity.Employee;
import com.ewa.common.entity.Employer;
import com.ewa.common.entity.LedgerEntry;
import com.ewa.common.entity.PayoutAttempt;
import com.ewa.common.entity.PayrollPeriod;
import com.ewa.common.entity.Withdrawal;
import com.ewa.common.entity.WebhookEvent;
import com.ewa.common.enums.BankAccountStatus;
import com.ewa.common.enums.LedgerEntryType;
import com.ewa.common.enums.LedgerReferenceType;
import com.ewa.common.enums.PaymentProvider;
import com.ewa.common.enums.PayoutAttemptStatus;
import com.ewa.common.enums.PayrollPeriodStatus;
import com.ewa.common.enums.WebhookProcessStatus;
import com.ewa.common.enums.WithdrawalStatus;
import com.ewa.common.repository.LedgerEntryRepository;
import com.ewa.common.repository.PayoutAttemptRepository;
import com.ewa.common.repository.WebhookEventRepository;
import com.ewa.common.repository.WithdrawalRepository;
import com.ewa.modules.payment.sepay.dto.SePayWebhookPayload;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("SePayWebhookProcessor Unit Tests")
class SePayWebhookProcessorTest {

    @Mock private WebhookEventRepository webhookEventRepository;
    @Mock private PayoutAttemptRepository payoutAttemptRepository;
    @Mock private WithdrawalRepository withdrawalRepository;
    @Mock private LedgerEntryRepository ledgerEntryRepository;

    @InjectMocks
    private SePayWebhookProcessor processor;

    private static final String EXT_TXN_ID = "SEPAY-TXN-001";
    private static final String REF_CODE = "WD-NV001-abc";
    private static final UUID WITHDRAWAL_ID = UUID.randomUUID();

    private Withdrawal withdrawal;
    private PayoutAttempt payoutAttempt;
    private WebhookEvent savedEvent;

    @BeforeEach
    void setUp() {
        Employer employer = new Employer();
        employer.setId(UUID.randomUUID());

        Employee employee = new Employee();
        employee.setId(UUID.randomUUID());
        employee.setEmployer(employer);

        PayrollPeriod payrollPeriod = new PayrollPeriod();
        payrollPeriod.setId(UUID.randomUUID());
        payrollPeriod.setStartDate(LocalDate.of(2025, 5, 1));
        payrollPeriod.setEndDate(LocalDate.of(2025, 5, 31));

        BankAccount bankAccount = new BankAccount();
        bankAccount.setId(UUID.randomUUID());
        bankAccount.setStatus(BankAccountStatus.VERIFIED);

        withdrawal = new Withdrawal();
        withdrawal.setId(WITHDRAWAL_ID);
        withdrawal.setEmployee(employee);
        withdrawal.setEmployer(employer);
        withdrawal.setPayrollPeriod(payrollPeriod);
        withdrawal.setBankAccount(bankAccount);
        withdrawal.setAmountRequestedVnd(1_000_000L);
        withdrawal.setFeeVnd(0L);
        withdrawal.setStatus(WithdrawalStatus.PROCESSING);
        withdrawal.setIdempotencyKey(REF_CODE);

        payoutAttempt = new PayoutAttempt();
        payoutAttempt.setId(UUID.randomUUID());
        payoutAttempt.setWithdrawal(withdrawal);
        payoutAttempt.setProvider(PaymentProvider.SEPAY);
        payoutAttempt.setExternalTxnId(EXT_TXN_ID);
        payoutAttempt.setStatus(PayoutAttemptStatus.SENT);

        savedEvent = new WebhookEvent();
        savedEvent.setId(UUID.randomUUID());
        savedEvent.setProcessStatus(WebhookProcessStatus.NEW);
    }

    @Test
    @DisplayName("Success webhook: should update withdrawal to SUCCESS and write 2 ledger entries for amount+fee")
    void process_success_writesTwoLedgerEntries() {
        // Setup
        when(webhookEventRepository.save(any())).thenReturn(savedEvent);
        when(webhookEventRepository.countByProviderAndExternalTxnIdAndEventTypeAndProcessStatus(
                eq(PaymentProvider.SEPAY), eq(EXT_TXN_ID), any(), eq(WebhookProcessStatus.PROCESSED)))
                .thenReturn(0L);
        when(payoutAttemptRepository.findByProviderAndExternalTxnId(PaymentProvider.SEPAY, EXT_TXN_ID))
                .thenReturn(Optional.of(payoutAttempt));
        when(ledgerEntryRepository.existsByEntryTypeAndReferenceTypeAndReferenceId(
                any(), any(), any())).thenReturn(false);

        // Withdrawal with fee=10000 to trigger FEE_DEBIT entry too
        withdrawal.setFeeVnd(10_000L);
        withdrawal.setTotalDebitVnd(1_010_000L);

        SePayWebhookPayload payload = buildPayload(EXT_TXN_ID, "00", true);

        processor.process(payload, "sig-abc", "{\"id\":\"SEPAY-TXN-001\"}");

        // Verify ledger writes: WITHDRAW_DEBIT + FEE_DEBIT
        ArgumentCaptor<LedgerEntry> ledgerCaptor = ArgumentCaptor.forClass(LedgerEntry.class);
        verify(ledgerEntryRepository, times(2)).save(ledgerCaptor.capture());

        var entries = ledgerCaptor.getAllValues();
        assertThat(entries).extracting(LedgerEntry::getEntryType)
                .containsExactlyInAnyOrder(LedgerEntryType.WITHDRAW_DEBIT, LedgerEntryType.FEE_DEBIT);
        assertThat(entries).extracting(LedgerEntry::getReferenceType)
                .allMatch(t -> t == LedgerReferenceType.WITHDRAWAL);
        assertThat(entries).extracting(LedgerEntry::getReferenceId)
                .allMatch(id -> id.equals(WITHDRAWAL_ID));

        // Verify withdrawal updated to SUCCESS
        ArgumentCaptor<Withdrawal> withdrawalCaptor = ArgumentCaptor.forClass(Withdrawal.class);
        verify(withdrawalRepository).save(withdrawalCaptor.capture());
        assertThat(withdrawalCaptor.getValue().getStatus()).isEqualTo(WithdrawalStatus.SUCCESS);
    }

    @Test
    @DisplayName("Duplicate webhook: should be IGNORED and NOT create duplicate ledger entries")
    void process_duplicate_marksIgnored() {
        when(webhookEventRepository.save(any())).thenReturn(savedEvent);
        when(webhookEventRepository.countByProviderAndExternalTxnIdAndEventTypeAndProcessStatus(
                eq(PaymentProvider.SEPAY), eq(EXT_TXN_ID), any(), eq(WebhookProcessStatus.PROCESSED)))
                .thenReturn(1L); // already processed

        SePayWebhookPayload payload = buildPayload(EXT_TXN_ID, "00", true);

        processor.process(payload, "sig-abc", "{}");

        // Should NOT write any ledger entries
        verify(ledgerEntryRepository, never()).save(any());
        verify(withdrawalRepository, never()).save(any());

        // Should mark event IGNORED
        ArgumentCaptor<WebhookEvent> eventCaptor = ArgumentCaptor.forClass(WebhookEvent.class);
        verify(webhookEventRepository, times(2)).save(eventCaptor.capture());
        assertThat(eventCaptor.getAllValues().get(1).getProcessStatus())
                .isEqualTo(WebhookProcessStatus.IGNORED);
    }

    @Test
    @DisplayName("Unknown externalTxnId: should mark webhook event FAILED and NOT create ledger entries")
    void process_unknownExternalTxnId_marksFailed() {
        when(webhookEventRepository.save(any())).thenReturn(savedEvent);
        when(webhookEventRepository.countByProviderAndExternalTxnIdAndEventTypeAndProcessStatus(
                eq(PaymentProvider.SEPAY), eq("UNKNOWN-TXN"), any(), eq(WebhookProcessStatus.PROCESSED)))
                .thenReturn(0L);
        when(payoutAttemptRepository.findByProviderAndExternalTxnId(PaymentProvider.SEPAY, "UNKNOWN-TXN"))
                .thenReturn(Optional.empty());

        SePayWebhookPayload payload = buildPayload("UNKNOWN-TXN", "00", true);

        processor.process(payload, null, "{}");

        verify(ledgerEntryRepository, never()).save(any());
        verify(withdrawalRepository, never()).save(any());

        // Event should be FAILED
        ArgumentCaptor<WebhookEvent> eventCaptor = ArgumentCaptor.forClass(WebhookEvent.class);
        verify(webhookEventRepository, times(2)).save(eventCaptor.capture());
        assertThat(eventCaptor.getAllValues().get(1).getProcessStatus())
                .isEqualTo(WebhookProcessStatus.FAILED);
    }

    @Test
    @DisplayName("Failed webhook: should mark withdrawal FAILED, NOT write ledger entries")
    void process_sePayFailure_marksWithdrawalFailed() {
        when(webhookEventRepository.save(any())).thenReturn(savedEvent);
        when(webhookEventRepository.countByProviderAndExternalTxnIdAndEventTypeAndProcessStatus(
                eq(PaymentProvider.SEPAY), eq(EXT_TXN_ID), any(), eq(WebhookProcessStatus.PROCESSED)))
                .thenReturn(0L);
        when(payoutAttemptRepository.findByProviderAndExternalTxnId(PaymentProvider.SEPAY, EXT_TXN_ID))
                .thenReturn(Optional.of(payoutAttempt));

        SePayWebhookPayload payload = buildPayload(EXT_TXN_ID, "99", false); // failure code

        processor.process(payload, null, "{}");

        verify(ledgerEntryRepository, never()).save(any());

        ArgumentCaptor<Withdrawal> withdrawalCaptor = ArgumentCaptor.forClass(Withdrawal.class);
        verify(withdrawalRepository).save(withdrawalCaptor.capture());
        assertThat(withdrawalCaptor.getValue().getStatus()).isEqualTo(WithdrawalStatus.FAILED);
    }

    // ─── helpers ────────────────────────────────────────────────────────────────

    private SePayWebhookPayload buildPayload(String id, String code, boolean success) {
        SePayWebhookPayload payload = new SePayWebhookPayload();
        payload.setId(id);
        payload.setCode(code);
        payload.setReferenceCode(REF_CODE);
        payload.setTransferAmount(1_000_000L);
        payload.setTransferType("out");
        return payload;
    }
}
