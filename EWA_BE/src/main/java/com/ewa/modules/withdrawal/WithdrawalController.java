package com.ewa.modules.withdrawal;

import com.ewa.modules.withdrawal.dto.WithdrawalRequest;
import com.ewa.modules.withdrawal.dto.WithdrawalResponse;
import com.ewa.security.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/withdrawals")
@RequiredArgsConstructor
public class WithdrawalController {

    private final WithdrawalService withdrawalService;

    /**
     * POST /api/withdrawals
     * Creates a new withdrawal request and initiates SePay transfer.
     * Returns 202 ACCEPTED with PROCESSING status.
     */
    @PostMapping
    public ResponseEntity<WithdrawalResponse> createWithdrawal(
            @Valid @RequestBody WithdrawalRequest request) {
        String employeeCode = SecurityUtils.getCurrentEmployeeCode();
        WithdrawalResponse response = withdrawalService.createWithdrawal(request, employeeCode);
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(response);
    }

    /**
     * GET /api/withdrawals/{id}
     * Returns current status of a withdrawal.
     */
    @GetMapping("/{id}")
    public ResponseEntity<WithdrawalResponse> getWithdrawal(@PathVariable UUID id) {
        String employeeCode = SecurityUtils.getCurrentEmployeeCode();
        WithdrawalResponse response = withdrawalService.getWithdrawal(id, employeeCode);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/withdrawals
     * Returns withdrawal history for the authenticated employee, newest first.
     */
    @GetMapping
    public ResponseEntity<List<WithdrawalResponse>> getHistory() {
        String employeeCode = SecurityUtils.getCurrentEmployeeCode();
        List<WithdrawalResponse> history = withdrawalService.getHistory(employeeCode);
        return ResponseEntity.ok(history);
    }
}
