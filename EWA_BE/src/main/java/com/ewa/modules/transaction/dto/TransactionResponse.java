package com.ewa.modules.transaction.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionResponse {
    private UUID id;
    private String type; // WITHDRAWAL, TOPUP, BILL, FEE, etc.
    private long amount;
    private String status; // SUCCESS, PENDING, etc.
    private Instant occurredAt;
    private String description;
}
