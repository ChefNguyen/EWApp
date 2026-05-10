package com.ewa.modules.withdrawal.impl;

import com.ewa.common.config.WithdrawalProperties;
import com.ewa.common.entity.BankAccount;
import com.ewa.common.entity.Employee;
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
import com.ewa.modules.payment.sepay.dto.SePayTransferRequest;
import com.ewa.modules.payment.sepay.dto.SePayTransferResponse;
import com.ewa.modules.withdrawal.WithdrawalService;
import com.ewa.modules.withdrawal.dto.WithdrawalRequest;
import com.ewa.modules.withdrawal.dto.WithdrawalResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "ewa.withdrawal.provider", havingValue = "sepay", matchIfMissing = true)
public class SePayWithdrawalServiceImpl implements WithdrawalService {

    // Fee policy: 10k for <= 1M, 20k for > 1M
    private static final long FEE_THRESHOLD_VND = 1_000_000L;
    private static final long FEE_UNDER_1M = 10_000L;
    private static final long FEE_ABOVE_1M = 20_000L;
    private static final String FEE_POLICY_STANDARD = "STANDARD";

    static long calculateFee(long amountVnd) {
        return amountVnd <= FEE_THRESHOLD_VND ? FEE_UNDER_1M : FEE_ABOVE_1M;
    }

    private final EmployeeRepository employeeRepository;
    private final BankAccountRepository bankAccountRepository;
    private final WithdrawalRepository withdrawalRepository;
    private final PayoutAttemptRepository payoutAttemptRepository;
    private final PayrollPeriodRepository payrollPeriodRepository;
    private final AvailableLimitService availableLimitService;
    private final SePayClient sePayClient;
    private final WithdrawalProperties withdrawalProperties;
    private final WithdrawalLedgerService withdrawalLedgerService;

    @Override
    @Transactional
    public WithdrawalResponse createWithdrawal(WithdrawalRequest request, String employeeCode) {
        // 1. Validate employee
        Employee employee = employeeRepository.findByEmployeeCode(employeeCode)
                .orElseThrow(() -> new IllegalArgumentException("Mã nhân viên không tồn tại: " + employeeCode));

        // 2. Validate bank account ownership
        BankAccount bankAccount = bankAccountRepository
                .findByIdAndEmployeeEmployeeCode(request.getBankAccountId(), employeeCode)
                .orElseGet(() -> bankAccountRepository.findByEmployeeEmployeeCodeOrderByCreatedAtDesc(employeeCode)
                        .stream()
                        .filter(account -> account.getStatus() == BankAccountStatus.VERIFIED)
                        .findFirst()
                        .orElseThrow(() -> new IllegalArgumentException("Tài khoản ngân hàng không hợp lệ hoặc không thuộc nhân viên này")));

        if (bankAccount.getStatus() != BankAccountStatus.VERIFIED) {
            throw new IllegalStateException("Tài khoản ngân hàng chưa được xác minh hoặc đã bị khoá");
        }

        // 3. Get active payroll period
        PayrollPeriod payrollPeriod = payrollPeriodRepository
                .findTopByEmployerIdAndStatusOrderByStartDateDesc(
                        employee.getEmployer().getId(), PayrollPeriodStatus.OPEN)
                .orElseThrow(() -> new IllegalStateException("Không tìm thấy kỳ lương đang mở"));

        // 4. Check available limit
        long available = availableLimitService.calculateAvailableLimit(employeeCode, payrollPeriod.getId());
        long feeVnd = calculateFee(request.getAmountVnd());
        long totalDebit = request.getAmountVnd() + feeVnd;

        if (totalDebit > available) {
            throw new IllegalStateException(
                    String.format("Số tiền vượt hạn mức. Hạn mức còn lại: %d VND, yêu cầu: %d VND (gồm phí %d VND)",
                            available, totalDebit, feeVnd));
        }

        // 5. Create Withdrawal with idempotency key
        String idempotencyKey = "WD-" + employeeCode + "-" + UUID.randomUUID();
        Withdrawal withdrawal = new Withdrawal();
        withdrawal.setEmployee(employee);
        withdrawal.setEmployer(employee.getEmployer());
        withdrawal.setPayrollPeriod(payrollPeriod);
        withdrawal.setBankAccount(bankAccount);
        withdrawal.setAmountRequestedVnd(request.getAmountVnd());
        withdrawal.setFeeVnd(feeVnd);
        withdrawal.setNetAmountVnd(request.getAmountVnd());
        withdrawal.setTotalDebitVnd(totalDebit);
        withdrawal.setFeePolicyCode(FEE_POLICY_STANDARD);
        withdrawal.setStatus(WithdrawalStatus.CREATED);
        withdrawal.setIdempotencyKey(idempotencyKey);
        withdrawal = withdrawalRepository.save(withdrawal);

        // 6. Create PayoutAttempt (INIT)
        PayoutAttempt attempt = new PayoutAttempt();
        attempt.setWithdrawal(withdrawal);
        attempt.setProvider(PaymentProvider.SEPAY);
        attempt.setStatus(PayoutAttemptStatus.INIT);
        attempt.setAttemptNo(1);
        // Placeholder externalTxnId until SePay responds
        attempt.setExternalTxnId("PENDING-" + idempotencyKey);

        String requestPayload = buildPayload(bankAccount, request.getAmountVnd(), idempotencyKey);
        attempt.setRequestPayload(requestPayload);
        attempt = payoutAttemptRepository.save(attempt);

        // 7. Call SePay
        try {
            SePayTransferRequest sePayRequest = SePayTransferRequest.builder()
                    .bankAccountNo(bankAccount.getAccountNoEncrypted()) // decrypted in real impl
                    .bankCode(bankAccount.getBankCode())
                    .amount(request.getAmountVnd())
                    .content("EWA rut luong " + idempotencyKey)
                    .referenceCode(idempotencyKey)
                    .build();

            SePayTransferResponse sePayResponse = sePayClient.transfer(sePayRequest);

            // 8. Update attempt → SENT
            String externalTxnId = sePayResponse.getTransactionId() != null
                    ? sePayResponse.getTransactionId()
                    : "UNKNOWN-" + idempotencyKey;
            attempt.setExternalTxnId(externalTxnId);
            attempt.setStatus(PayoutAttemptStatus.SENT);
            attempt.setSentAt(Instant.now());
            payoutAttemptRepository.save(attempt);

            // 9. Commit ledger + mark SUCCESS immediately (local mock / no webhook)
            //    Webhook will be idempotent guard if called later.
            if (withdrawalProperties.isCommitLedgerImmediately()) {
                withdrawalLedgerService.writeAllEntries(withdrawal);
                withdrawal.setStatus(WithdrawalStatus.SUCCESS);
                withdrawal = withdrawalRepository.save(withdrawal);
                log.info("[Withdrawal] SUCCESS (immediate commit) withdrawalId={} externalTxnId={}",
                        withdrawal.getId(), externalTxnId);
                return buildResponse(withdrawal, externalTxnId, "Rút lương thành công");
            }

            // 10. Real SePay path: withdrawal stays PROCESSING, webhook will finalize
            withdrawal.setStatus(WithdrawalStatus.PROCESSING);
            withdrawal = withdrawalRepository.save(withdrawal);

            log.info("[Withdrawal] PROCESSING withdrawalId={} externalTxnId={}", withdrawal.getId(), externalTxnId);

            return buildResponse(withdrawal, externalTxnId, "Yêu cầu rút lương đang xử lý");

        } catch (SePayClientException e) {
            // 9. On error: mark FAILED
            log.error("[Withdrawal] SePay transfer failed withdrawalId={}: {}", withdrawal.getId(), e.getMessage());

            attempt.setStatus(PayoutAttemptStatus.FAILED);
            attempt.setLastError(e.getMessage());
            payoutAttemptRepository.save(attempt);

            withdrawal.setStatus(WithdrawalStatus.FAILED);
            withdrawal.setFailureCode("SEPAY_ERROR");
            withdrawal.setFailureMessage(e.getMessage());
            withdrawal = withdrawalRepository.save(withdrawal);

            throw new IllegalStateException("Không thể kết nối đến cổng thanh toán: " + e.getMessage(), e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public WithdrawalResponse getWithdrawal(UUID withdrawalId, String employeeCode) {
        Withdrawal withdrawal = withdrawalRepository
                .findByIdAndEmployeeEmployeeCode(withdrawalId, employeeCode)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy yêu cầu rút lương"));

        String externalTxnId = payoutAttemptRepository
                .findTopByWithdrawalIdOrderByAttemptNoDesc(withdrawalId)
                .map(PayoutAttempt::getExternalTxnId)
                .orElse(null);

        return buildResponse(withdrawal, externalTxnId, null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<WithdrawalResponse> getHistory(String employeeCode) {
        return withdrawalRepository
                .findByEmployeeEmployeeCodeOrderByCreatedAtDesc(employeeCode)
                .stream()
                .map(w -> {
                    String txnId = payoutAttemptRepository
                            .findTopByWithdrawalIdOrderByAttemptNoDesc(w.getId())
                            .map(PayoutAttempt::getExternalTxnId)
                            .orElse(null);
                    return buildResponse(w, txnId, null);
                })
                .collect(Collectors.toList());
    }

    // ─── helpers ────────────────────────────────────────────────────────────────

    private WithdrawalResponse buildResponse(Withdrawal w, String externalTxnId, String message) {
        return WithdrawalResponse.builder()
                .withdrawalId(w.getId())
                .status(w.getStatus())
                .amountVnd(w.getAmountRequestedVnd())
                .feeVnd(w.getFeeVnd())
                .totalDebitVnd(w.getTotalDebitVnd())
                .netAmountVnd(w.getNetAmountVnd())
                .externalTxnId(externalTxnId)
                .message(message)
                .createdAt(w.getCreatedAt())
                .build();
    }

    private String buildPayload(BankAccount bankAccount, long amount, String refCode) {
        return String.format("{\"bankCode\":\"%s\",\"last4\":\"%s\",\"amount\":%d,\"ref\":\"%s\"}",
                bankAccount.getBankCode(), bankAccount.getAccountNoLast4(), amount, refCode);
    }
}
