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
                .employee(AuthResponse.EmployeeResponse.fromEntity(
                        employee,
                        20000000,
                        15,
                        0))
                .build();
    }
}
