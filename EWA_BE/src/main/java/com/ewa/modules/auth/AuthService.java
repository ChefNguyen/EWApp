package com.ewa.modules.auth;

import com.ewa.common.dto.AuthResponse;
import com.ewa.common.dto.LoginRequest;
import com.ewa.common.dto.OtpRequest;
import com.ewa.common.entity.Employee;
import com.ewa.common.repository.EmployeeRepository;
import com.ewa.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.User;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final EmployeeRepository employeeRepository;
    private final JwtService jwtService;

    // Hardcoded for Dev environment
    private static final String DEV_OTP = "123456";

    public Employee verifyEmployee(LoginRequest request) {
        return employeeRepository.findByEmployeeCode(request.getEmployeeCode())
                .orElseThrow(() -> new RuntimeException("Mã nhân viên không tồn tại"));
    }

    public AuthResponse.EmployeeResponse getEmployeeDetails(Employee employee) {
        long grossSalary = 20000000;
        int workingDays = 15;
        long advancedAmount = 0;
        Object linkedBank = null;

        switch (employee.getEmployeeCode()) {
            case "NV001":
                grossSalary = 20000000;
                workingDays = 15;
                advancedAmount = 2020000;
                break;
            case "NV002":
                grossSalary = 15000000;
                workingDays = 20;
                advancedAmount = 0;
                linkedBank = java.util.Map.of("bankCode", "VCB", "accountNo", "1234567890", "accountName", "TRAN THI B");
                break;
            case "NV003":
                grossSalary = 10000000;
                workingDays = 10;
                advancedAmount = 2272000;
                linkedBank = java.util.Map.of("bankCode", "MB", "accountNo", "5555666677", "accountName", "LE VAN C");
                break;
            case "NV004":
                grossSalary = 5000000;
                workingDays = 5;
                advancedAmount = 0;
                linkedBank = java.util.Map.of("bankCode", "ACB", "accountNo", "9999888877", "accountName", "PHAM THI D");
                break;
        }

        return AuthResponse.EmployeeResponse.fromEntity(employee, grossSalary, workingDays, advancedAmount, linkedBank);
    }

    public AuthResponse verifyOtp(OtpRequest request) {
        if (!DEV_OTP.equals(request.getOtp())) {
            throw new RuntimeException("OTP không hợp lệ");
        }

        Employee employee = employeeRepository.findByEmployeeCode(request.getEmployeeCode())
                .orElseThrow(() -> new RuntimeException("Mã nhân viên không tồn tại"));

        var userDetails = new User(employee.getEmployeeCode(), "", Collections.emptyList());
        var jwtToken = jwtService.generateToken(userDetails);

        return AuthResponse.builder()
                .token(jwtToken)
                .employee(getEmployeeDetails(employee))
                .build();
    }
}
