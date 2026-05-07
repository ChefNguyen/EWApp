package com.ewa.common.repository;

import com.ewa.common.entity.WebhookEvent;
import com.ewa.common.enums.PaymentProvider;
import com.ewa.common.enums.WebhookProcessStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface WebhookEventRepository extends JpaRepository<WebhookEvent, UUID> {

    boolean existsByProviderAndExternalTxnIdAndEventType(
            PaymentProvider provider, String externalTxnId, String eventType);

    Optional<WebhookEvent> findByProviderAndExternalTxnIdAndEventType(
            PaymentProvider provider, String externalTxnId, String eventType);

    /**
     * Count already-processed events to detect duplicate webhooks.
     * Used by SePayWebhookProcessor for idempotency.
     */
    long countByProviderAndExternalTxnIdAndEventTypeAndProcessStatus(
            PaymentProvider provider,
            String externalTxnId,
            String eventType,
            WebhookProcessStatus processStatus
    );
}

