package com.ewa.modules.utility.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class BillPayResponse {

    private boolean success;
    private String transactionId;
    private long newLimit;
    private long feeVnd;
    private String error;
}
