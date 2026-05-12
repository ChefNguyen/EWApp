package com.ewa.modules.transaction;

import com.ewa.common.entity.LedgerEntry;
import com.ewa.common.enums.LedgerEntryType;
import com.ewa.common.enums.LedgerReferenceType;
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
        // Fetch more to account for grouping
        List<LedgerEntry> entries = ledgerEntryRepository.findTop50ByEmployeeEmployeeCodeOrderByOccurredAtDesc(employeeCode);

        // Group by referenceId to merge withdrawal and fee
        java.util.Map<java.util.UUID, TransactionResponse> aggregated = new java.util.LinkedHashMap<>();

        for (LedgerEntry entry : entries) {
            java.util.UUID refId = entry.getReferenceId();
            
            if (refId != null && aggregated.containsKey(refId) && entry.getReferenceType() == LedgerReferenceType.WITHDRAWAL) {
                TransactionResponse existing = aggregated.get(refId);
                existing.setAmount(existing.getAmount() + entry.getAmountVnd());
                if (entry.getEntryType() == LedgerEntryType.WITHDRAW_DEBIT) {
                    existing.setType(LedgerEntryType.WITHDRAW_DEBIT.name());
                    existing.setDescription("Rút tiền lương");
                }
            } else {
                aggregated.put(refId != null ? refId : java.util.UUID.randomUUID(), mapToResponse(entry));
            }
        }

        // Return top 20 after aggregation
        List<TransactionResponse> result = aggregated.values().stream()
                .limit(20)
                .collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    private TransactionResponse mapToResponse(LedgerEntry entry) {
        String type = entry.getEntryType().name();
        String description = formatDescription(entry);

        return TransactionResponse.builder()
                .id(entry.getId())
                .type(type)
                .amount(entry.getAmountVnd())
                .status("SUCCESS")
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
