package com.ewa.modules.transaction;

import com.ewa.common.entity.LedgerEntry;
import com.ewa.common.enums.LedgerEntryType;
import com.ewa.common.repository.LedgerEntryRepository;
import com.ewa.modules.transaction.dto.TransactionResponse;
import com.ewa.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final LedgerEntryRepository ledgerEntryRepository;

    @GetMapping
    public ResponseEntity<List<TransactionResponse>> getTransactionHistory() {
        String employeeCode = SecurityUtils.getCurrentEmployeeCode();
        List<LedgerEntry> entries = ledgerEntryRepository.findTop20ByEmployeeEmployeeCodeOrderByOccurredAtDesc(employeeCode);

        List<TransactionResponse> responses = entries.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(responses);
    }

    private TransactionResponse mapToResponse(LedgerEntry entry) {
        String type = entry.getEntryType().name();
        String description = formatDescription(entry);

        return TransactionResponse.builder()
                .id(entry.getId())
                .type(type)
                .amount(entry.getAmountVnd())
                .status("SUCCESS") // Ledger entries represent completed accounting actions
                .occurredAt(entry.getOccurredAt())
                .description(description)
                .build();
    }

    private String formatDescription(LedgerEntry entry) {
        switch (entry.getEntryType()) {
            case WITHDRAW_DEBIT: return "Rút tiền lương";
            case TOPUP_DEBIT: return "Nạp tiền điện thoại";
            case BILL_DEBIT: return "Thanh toán hóa đơn";
            case FEE_DEBIT: return "Phí giao dịch";
            case EARNED: return "Thu nhập tạm tính";
            default: return entry.getEntryType().name();
        }
    }
}
