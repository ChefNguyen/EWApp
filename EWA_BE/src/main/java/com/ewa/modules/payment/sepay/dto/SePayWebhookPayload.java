package com.ewa.modules.payment.sepay.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * Incoming webhook payload from SePay.
 * Maps the JSON body that SePay POSTs to /api/webhooks/sepay.
 */
@Getter
@Setter
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class SePayWebhookPayload {

    /** SePay internal transaction / event ID. */
    @JsonProperty("id")
    private String id;

    /** Payment gateway used by SePay (e.g. "VietQR", "Bank"). */
    @JsonProperty("gateway")
    private String gateway;

    /** Transfer amount in VND (long). */
    @JsonProperty("transferAmount")
    private long transferAmount;

    /**
     * SePay response code.
     * "00" = success, other = failure/pending.
     */
    @JsonProperty("code")
    private String code;

    /**
     * Reference code echo'd back from the transfer request.
     * Maps to Withdrawal idempotency key.
     */
    @JsonProperty("referenceCode")
    private String referenceCode;

    /** Type: "in" (credit) or "out" (debit). */
    @JsonProperty("transferType")
    private String transferType;

    /** When the transfer occurred on the bank side. */
    @JsonProperty("transactionDate")
    private Instant transactionDate;

    /** Bank account number on SePay side. */
    @JsonProperty("accountNumber")
    private String accountNumber;

    public boolean isSuccess() {
        return "00".equals(code);
    }
}
