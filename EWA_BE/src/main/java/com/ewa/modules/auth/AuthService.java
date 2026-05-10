package com.ewa.modules.auth;

import com.ewa.common.dto.AuthResponse;
import com.ewa.common.dto.LoginRequest;
import com.ewa.common.dto.OtpRequest;
import com.ewa.common.entity.BankAccount;
import com.ewa.common.entity.Employee;
import com.ewa.common.entity.PayPolicy;
import com.ewa.common.entity.PayrollPeriod;
import com.ewa.common.enums.PayrollPeriodStatus;
import com.ewa.common.repository.BankAccountRepository;
import com.ewa.common.repository.EmployeeRepository;
import com.ewa.common.repository.PayPolicyRepository;
import com.ewa.common.repository.PayrollPeriodRepository;
import com.ewa.common.repository.WorkEntryRepository;
import com.ewa.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.userdetails.User;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Collections;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final EmployeeRepository employeeRepository;
    private final BankAccountRepository bankAccountRepository;
    private final PayrollPeriodRepository payrollPeriodRepository;
    private final PayPolicyRepository payPolicyRepository;
    private final WorkEntryRepository workEntryRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    // Hardcoded for Dev environment
    private static final String DEV_OTP = "123456";

    public AuthResponse.EmployeeResponse getEmployeeDetails(Employee employee) {
        PayrollPeriod payrollPeriod = payrollPeriodRepository
                .findTopByEmployerIdAndStatusOrderByStartDateDesc(employee.getEmployer().getId(), PayrollPeriodStatus.OPEN)
                .orElse(null);

        long grossSalary = 0L;
        int workingDays = 0;
        long advancedAmount = 0L;

        if (payrollPeriod != null) {
            PayPolicy policy = payPolicyRepository
                    .findByEmployerIdAndEffectiveFromLessThanEqualAndEffectiveToIsNullOrEffectiveToGreaterThanEqualOrderByEffectiveFromDesc(
                            employee.getEmployer().getId(),
                            payrollPeriod.getEndDate(),
                            payrollPeriod.getStartDate()
                    )
                    .stream()
                    .findFirst()
                    .orElse(null);

            if (policy != null) {
                grossSalary = policy.getStandardUnits() * 1_000_000L;
            }

            workingDays = workEntryRepository
                    .sumWorkedUnitsByEmployeeAndPayrollPeriod(employee.getId(), payrollPeriod.getId())
                    .intValue();
        }

        Object linkedBank = bankAccountRepository
                .findByEmployeeEmployeeCodeOrderByCreatedAtDesc(employee.getEmployeeCode())
                .stream()
                .findFirst()
                .map(this::toLinkedBank)
                .orElse(null);

        return AuthResponse.EmployeeResponse.fromEntity(employee, grossSalary, workingDays, advancedAmount, linkedBank);
    }

    private Map<String, String> toLinkedBank(BankAccount bankAccount) {
        return Map.of(
                "id", bankAccount.getId().toString(),
                "bankCode", bankAccount.getBankCode(),
                "accountNo", bankAccount.getAccountNoEncrypted(),
                "maskedAccountNo", bankAccount.getMaskedAccountNo(),
                "accountName", bankAccount.getAccountNameVerified()
        );
    }

    public AuthResponse handleLogin(LoginRequest request) {
        Employee employee = employeeRepository.findByEmployeeCode(request.getEmployeeCode())
                .orElseThrow(() -> new RuntimeException("Mã nhân viên không tồn tại"));

        AuthResponse.EmployeeResponse employeeResponse = getEmployeeDetails(employee);

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            if (employee.getPasswordHash() == null) {
                throw new RuntimeException("Tài khoản chưa đặt mật khẩu");
            }
            if (!passwordEncoder.matches(request.getPassword(), employee.getPasswordHash())) {
                throw new RuntimeException("Mật khẩu không đúng");
            }
            var userDetails = new User(employee.getEmployeeCode(), "", Collections.emptyList());
            var jwtToken = jwtService.generateToken(userDetails);
            return AuthResponse.builder()
                    .token(jwtToken)
                    .employee(employeeResponse)
                    .build();
        }

        return AuthResponse.builder()
                .employee(employeeResponse)
                .build();
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
