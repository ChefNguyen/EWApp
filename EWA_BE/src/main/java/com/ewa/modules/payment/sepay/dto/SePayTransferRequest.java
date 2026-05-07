package com.ewa.modules.payment.sepay.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class SePayTransferRequest {

    @JsonProperty("bank_account_no")
    private String bankAccountNo;

    @JsonProperty("bank_code")
    private String bankCode;

    @JsonProperty("amount")
    private long amount;

    @JsonProperty("content")
    private String content;

    @JsonProperty("reference_code")
    private String referenceCode;
}
