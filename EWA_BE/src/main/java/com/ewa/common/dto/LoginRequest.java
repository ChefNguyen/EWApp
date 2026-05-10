package com.ewa.common.dto;

import lombok.Data;

@Data
public class LoginRequest {
    private String employeeCode;
    private String password; // optional — for password login
}
