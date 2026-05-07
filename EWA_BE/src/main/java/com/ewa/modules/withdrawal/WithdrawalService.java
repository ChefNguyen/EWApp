package com.ewa.modules.withdrawal;

import com.ewa.modules.withdrawal.dto.WithdrawalRequest;
import com.ewa.modules.withdrawal.dto.WithdrawalResponse;

import java.util.List;
import java.util.UUID;

public interface WithdrawalService {

    /**
     * Initiates a new withdrawal for the given employee.
     * Validates ownership, limit, then calls the payment provider.
     *
     * @param request     withdrawal details
     * @param employeeCode authenticated employee's code (from JWT or request)
     * @return response with status PROCESSING
     */
    WithdrawalResponse createWithdrawal(WithdrawalRequest request, String employeeCode);

    /**
     * Returns the current state of a withdrawal.
     *
     * @param withdrawalId UUID of the withdrawal
     * @param employeeCode must match withdrawal owner
     * @return current withdrawal response
     */
    WithdrawalResponse getWithdrawal(UUID withdrawalId, String employeeCode);

    /**
     * Returns all withdrawals for the given employee, newest first.
     *
     * @param employeeCode employee identifier
     * @return ordered list of withdrawal responses
     */
    List<WithdrawalResponse> getHistory(String employeeCode);
}
