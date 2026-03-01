package com.ewa.common.entity;

import com.ewa.common.enums.WithdrawalStatus;
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

import java.util.UUID;

@Entity
@Table(name = "withdrawals",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"employee_id", "idempotency_key"})
        },
        indexes = {
                @Index(name = "idx_withdrawals_emp_period_status", columnList = "employee_id, payroll_period_id, status")
        })
@Getter
@Setter
@NoArgsConstructor
public class Withdrawal extends BaseAuditable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employer_id", nullable = false)
    private Employer employer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payroll_period_id", nullable = false)
    private PayrollPeriod payrollPeriod;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bank_account_id", nullable = false)
    private BankAccount bankAccount;

    @Column(name = "amount_requested_vnd", nullable = false)
    private long amountRequestedVnd;

    @Column(name = "fee_vnd", nullable = false)
    private long feeVnd;

    @Column(name = "total_debit_vnd", nullable = false)
    private long totalDebitVnd;

    @Column(name = "net_amount_vnd", nullable = false)
    private long netAmountVnd;

    @Column(name = "fee_policy_code", nullable = false)
    private String feePolicyCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private WithdrawalStatus status;

    @Column(name = "idempotency_key", nullable = false)
    private String idempotencyKey;

    @Column(name = "failure_code")
    private String failureCode;

    @Column(name = "failure_message")
    private String failureMessage;
}
