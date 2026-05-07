package com.ewa.modules.utility.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TopupResponse {

    private boolean success;
    private String transactionId;
    private long newLimit;
    private String error;
}
