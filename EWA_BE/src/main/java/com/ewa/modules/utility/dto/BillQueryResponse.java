package com.ewa.modules.utility.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class BillQueryResponse {

    private String billKey;
    private String customerName;
    private String address;
    private long amount;
    private String period;
    private String status;
    private String error;

    public boolean isFound() {
        return error == null && billKey != null;
    }
}
