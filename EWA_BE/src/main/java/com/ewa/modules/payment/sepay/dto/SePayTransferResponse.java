package com.ewa.modules.payment.sepay.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Maps the SePay sandbox transfer response.
 * Fields not defined here are safely ignored.
 */
@Getter
@Setter
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class SePayTransferResponse {

    /** SePay internal transaction ID - used as externalTxnId in PayoutAttempt. */
    @JsonProperty("transaction_id")
    private String transactionId;

    /** Response code: "00" = success. */
    @JsonProperty("code")
    private String code;

    /** Human-readable message. */
    @JsonProperty("message")
    private String message;

    /** Transfer status returned by SePay (e.g. "PENDING", "SUCCESS"). */
    @JsonProperty("status")
    private String status;

    public boolean isSuccess() {
        return "00".equals(code) || "success".equalsIgnoreCase(status);
    }
}
