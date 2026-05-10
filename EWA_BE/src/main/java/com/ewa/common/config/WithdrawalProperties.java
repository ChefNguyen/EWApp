package com.ewa.common.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Binds {@code ewa.withdrawal.*} properties from application.yml.
 */
@Configuration
@ConfigurationProperties(prefix = "ewa.withdrawal")
@Getter
@Setter
public class WithdrawalProperties {

    /**
     * When true, ledger entries (WITHDRAW_DEBIT + FEE_DEBIT) are written
     * immediately after the SePay provider returns success, before webhook.
     * Webhook guard ensures no double-write if called.
     */
    private boolean commitLedgerImmediately = true;
}