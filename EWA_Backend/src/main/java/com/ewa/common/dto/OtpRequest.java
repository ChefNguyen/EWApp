package com.ewa.common.dto;

import lombok.Data;

@Data
public class OtpRequest {
    private String employeeCode;
    private String otp;
}
