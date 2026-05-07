package com.ewa.modules.withdrawal.dto;

import com.ewa.common.enums.WithdrawalStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Builder
public class WithdrawalResponse {

    private UUID withdrawalId;
    private WithdrawalStatus status;
    private long amountVnd;
    private long feeVnd;
    private long totalDebitVnd;
    private long netAmountVnd;
    private String externalTxnId;
    private String message;
    private Instant createdAt;
}
