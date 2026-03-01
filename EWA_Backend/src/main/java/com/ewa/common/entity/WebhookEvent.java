package com.ewa.common.entity;

import com.ewa.common.enums.PaymentProvider;
import com.ewa.common.enums.WebhookProcessStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "webhook_events",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"provider", "external_txn_id", "event_type"})
        },
        indexes = {
                @Index(name = "idx_webhook_events_provider_txn", columnList = "provider, external_txn_id")
        })
@Getter
@Setter
@NoArgsConstructor
public class WebhookEvent extends BaseAuditable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(name = "provider", nullable = false)
    private PaymentProvider provider;

    @Column(name = "external_txn_id", nullable = false)
    private String externalTxnId;

    @Column(name = "event_type", nullable = false)
    private String eventType;

    @Column(name = "signature")
    private String signature;

    @Column(name = "payload", columnDefinition = "jsonb")
    private String payload;

    @Column(name = "received_at", nullable = false)
    private Instant receivedAt;

    @Column(name = "processed_at")
    private Instant processedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "process_status", nullable = false)
    private WebhookProcessStatus processStatus;
}
