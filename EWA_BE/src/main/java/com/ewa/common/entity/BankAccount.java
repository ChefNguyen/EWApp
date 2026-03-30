package com.ewa.common.entity;

import com.ewa.common.enums.BankAccountStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "bank_accounts")
@Getter
@Setter
@NoArgsConstructor
public class BankAccount extends BaseAuditable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(name = "bank_code", nullable = false)
    private String bankCode;

    @Column(name = "account_no_encrypted", nullable = false)
    private String accountNoEncrypted;

    @Column(name = "account_no_last4", nullable = false, length = 4)
    private String accountNoLast4;

    @Column(name = "account_name_verified", nullable = false)
    private String accountNameVerified;

    @Column(name = "verified_at")
    private Instant verifiedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private BankAccountStatus status;

    @Column(name = "provider_ref")
    private String providerRef;
}
