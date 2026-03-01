package com.ewa.common.entity;

import com.ewa.common.enums.PaymentProvider;
import com.ewa.common.enums.PayoutAttemptStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "payout_attempts",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"provider", "external_txn_id"})
        },
        indexes = {
                @Index(name = "idx_payout_attempts_withdrawal_attempt", columnList = "withdrawal_id, attempt_no")
        })
@Getter
@Setter
@NoArgsConstructor
public class PayoutAttempt extends BaseAuditable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "withdrawal_id", nullable = false)
    private Withdrawal withdrawal;

    @Enumerated(EnumType.STRING)
    @Column(name = "provider", nullable = false)
    private PaymentProvider provider;

    @Column(name = "request_payload", columnDefinition = "jsonb")
    private String requestPayload;

    @Column(name = "external_txn_id", nullable = false)
    private String externalTxnId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private PayoutAttemptStatus status;

    @Column(name = "attempt_no", nullable = false)
    private int attemptNo;

    @Column(name = "sent_at")
    private Instant sentAt;

    @Column(name = "last_error")
    private String lastError;
}
