package com.ewa.modules.webhook;

import com.ewa.common.entity.PayoutAttempt;
import com.ewa.common.entity.WebhookEvent;
import com.ewa.common.entity.Withdrawal;
import com.ewa.common.enums.PaymentProvider;
import com.ewa.common.enums.PayoutAttemptStatus;
import com.ewa.common.enums.WebhookProcessStatus;
import com.ewa.common.enums.WithdrawalStatus;
import com.ewa.common.repository.PayoutAttemptRepository;
import com.ewa.common.repository.WebhookEventRepository;
import com.ewa.common.repository.WithdrawalRepository;
import com.ewa.modules.payment.sepay.dto.SePayWebhookPayload;
import com.ewa.modules.withdrawal.impl.WithdrawalLedgerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Slf4j
@Service
@RequiredArgsConstructor
public class SePayWebhookProcessor {

    private static final String EVENT_TYPE_TRANSFER = "TRANSFER";

    private final WebhookEventRepository webhookEventRepository;
    private final PayoutAttemptRepository payoutAttemptRepository;
    private final WithdrawalRepository withdrawalRepository;
    private final WithdrawalLedgerService withdrawalLedgerService;

    /**
     * Processes a SePay webhook payload in a single transaction.
     * <ol>
     *   <li>Persist the raw event (NEW) for audit trail</li>
     *   <li>Idempotency check – ignore duplicates</li>
     *   <li>Locate the PayoutAttempt by externalTxnId</li>
     *   <li>Update Withdrawal + PayoutAttempt status</li>
     *   <li>On success: write WITHDRAW_DEBIT + FEE_DEBIT ledger entries</li>
     *   <li>Mark event PROCESSED or FAILED</li>
     * </ol>
     *
     * @param payload   parsed SePay webhook body
     * @param signature raw signature header for audit
     * @param rawBody   raw JSON string saved to webhook_events.payload
     */
    @Transactional
    public void process(SePayWebhookPayload payload, String signature, String rawBody) {
        String externalTxnId = payload.getId();
        String eventType = EVENT_TYPE_TRANSFER;

        // Step 1 – persist raw event first (audit trail regardless of outcome)
        WebhookEvent event = new WebhookEvent();
        event.setProvider(PaymentProvider.SEPAY);
        event.setExternalTxnId(externalTxnId);
        event.setEventType(eventType);
        event.setSignature(signature);
        event.setPayload(rawBody);
        event.setReceivedAt(Instant.now());
        event.setProcessStatus(WebhookProcessStatus.NEW);
        event = webhookEventRepository.save(event);

        try {
            // Step 2 – idempotency check
            long duplicateCount = webhookEventRepository
                    .countByProviderAndExternalTxnIdAndEventTypeAndProcessStatus(
                            PaymentProvider.SEPAY, externalTxnId, eventType,
                            WebhookProcessStatus.PROCESSED);
            if (duplicateCount > 0) {
                log.warn("[Webhook] Duplicate event ignored externalTxnId={}", externalTxnId);
                event.setProcessStatus(WebhookProcessStatus.IGNORED);
                event.setProcessedAt(Instant.now());
                webhookEventRepository.save(event);
                return;
            }

            // Step 3 – locate payout attempt by externalTxnId
            PayoutAttempt attempt = payoutAttemptRepository
                    .findByProviderAndExternalTxnId(PaymentProvider.SEPAY, externalTxnId)
                    .orElse(null);

            if (attempt == null) {
                // Also try to find by referenceCode (idempotency key prefix match)
                log.warn("[Webhook] No PayoutAttempt found for externalTxnId={} referenceCode={}",
                        externalTxnId, payload.getReferenceCode());
                event.setProcessStatus(WebhookProcessStatus.FAILED);
                event.setProcessedAt(Instant.now());
                webhookEventRepository.save(event);
                return;
            }

            Withdrawal withdrawal = attempt.getWithdrawal();

            // Step 4 – update statuses
            if (payload.isSuccess()) {
                attempt.setStatus(PayoutAttemptStatus.SETTLED);
                withdrawal.setStatus(WithdrawalStatus.SUCCESS);

                // Write ledger entries via central service (idempotent guard)
                withdrawalLedgerService.writeAllEntries(withdrawal);

                log.info("[Webhook] Withdrawal SUCCESS withdrawalId={} externalTxnId={}",
                        withdrawal.getId(), externalTxnId);
            } else {
                attempt.setStatus(PayoutAttemptStatus.FAILED);
                attempt.setLastError("SePay code: " + payload.getCode());
                withdrawal.setStatus(WithdrawalStatus.FAILED);
                withdrawal.setFailureCode(payload.getCode());
                withdrawal.setFailureMessage("SePay transfer failed");

                log.warn("[Webhook] Withdrawal FAILED withdrawalId={} code={}", withdrawal.getId(), payload.getCode());
            }

            payoutAttemptRepository.save(attempt);
            withdrawalRepository.save(withdrawal);

            // Step 6 – mark event PROCESSED
            event.setProcessStatus(WebhookProcessStatus.PROCESSED);
            event.setProcessedAt(Instant.now());
            webhookEventRepository.save(event);

        } catch (Exception e) {
            log.error("[Webhook] Processing error externalTxnId={}: {}", externalTxnId, e.getMessage(), e);
            event.setProcessStatus(WebhookProcessStatus.FAILED);
            event.setProcessedAt(Instant.now());
            webhookEventRepository.save(event);
            throw e;
        }
    }
}
