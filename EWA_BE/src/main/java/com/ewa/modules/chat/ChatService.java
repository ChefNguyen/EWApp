package com.ewa.modules.chat;

import com.ewa.modules.chat.dto.ChatRequest;
import com.ewa.modules.chat.dto.ChatResponse;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatService {

    private static final int MAX_WITHDRAWALS = 10;

    private final com.ewa.common.repository.EmployeeRepository employeeRepository;
    private final com.ewa.common.repository.WithdrawalRepository withdrawalRepository;
    private final com.ewa.common.repository.LedgerEntryRepository ledgerEntryRepository;
    private final com.ewa.modules.payment.AvailableLimitService availableLimitService;
    private final GeminiChatClient geminiChatClient;

    public ChatResponse chat(ChatRequest request) {
        String employeeCode = request.getEmployeeCode().trim();
        com.ewa.common.entity.Employee employee = employeeRepository.findByEmployeeCode(employeeCode)
                .orElseThrow(() -> new RuntimeException("Mã nhân viên không tồn tại"));

        // Gọi trực tiếp logic tính hạn mức từ Core module
        long availableLimit = availableLimitService.calculateAvailableLimit(employeeCode);

        List<com.ewa.common.entity.Withdrawal> withdrawals = withdrawalRepository.findByEmployeeEmployeeCodeOrderByCreatedAtDesc(employeeCode)
                .stream()
                .limit(MAX_WITHDRAWALS)
                .toList();
        List<com.ewa.common.entity.LedgerEntry> ledgerEntries = ledgerEntryRepository.findTop50ByEmployeeEmployeeCodeOrderByOccurredAtDesc(employeeCode);

        try {
            String answer = geminiChatClient.ask(buildSystemPrompt(), buildUserPrompt(employee, availableLimit, withdrawals, ledgerEntries, request.getMessage()));
            return ChatResponse.builder()
                    .employeeCode(employeeCode)
                    .answer(answer)
                    .build();
        } catch (Exception e) {
            log.error("Gemini API error: {}", e.getMessage());
            return ChatResponse.builder()
                    .employeeCode(employeeCode)
                    .answer("Xin lỗi, dịch vụ AI đang bận. Vui lòng thử lại sau ít phút.")
                    .build();
        }
    }

    private String buildSystemPrompt() {
        return "Bạn là trợ lý AI của EWApp cho nhân viên. "
                + "Chỉ trả lời bằng tiếng Việt dựa trên dữ liệu DB được cung cấp. "
                + "Bạn chỉ hỗ trợ câu hỏi về hạn mức rút lương, lịch sử giao dịch và hóa đơn. "
                + "Nếu dữ liệu không có trong ngữ cảnh, hãy nói rõ là chưa có dữ liệu. "
                + "Không tự bịa số dư, hóa đơn, giao dịch hoặc trạng thái.";
    }

    private String buildUserPrompt(com.ewa.common.entity.Employee employee, long availableLimit, List<com.ewa.common.entity.Withdrawal> withdrawals, List<com.ewa.common.entity.LedgerEntry> ledgerEntries, String message) {
        StringBuilder context = new StringBuilder();
        context.append("Dữ liệu nhân viên:\n");
        context.append("- Mã nhân viên: ").append(employee.getEmployeeCode()).append('\n');
        context.append("- Họ tên: ").append(employee.getFullName()).append('\n');
        context.append("- Hạn mức rút lương khả dụng: ").append(availableLimit).append(" VND\n\n");

        context.append("Lịch sử rút lương gần đây:\n");
        if (withdrawals.isEmpty()) {
            context.append("- Chưa có giao dịch rút lương\n");
        } else {
            withdrawals.forEach(withdrawal -> context.append("- ")
                    .append(withdrawal.getCreatedAt()).append(" | ")
                    .append(withdrawal.getStatus()).append(" | yêu cầu ")
                    .append(withdrawal.getAmountRequestedVnd()).append(" VND | phí ")
                    .append(withdrawal.getFeeVnd()).append(" VND | thực nhận ")
                    .append(withdrawal.getNetAmountVnd()).append(" VND\n"));
        }

        context.append("\nSổ cái/giao dịch gần đây:\n");
        if (ledgerEntries.isEmpty()) {
            context.append("- Chưa có dữ liệu sổ cái\n");
        } else {
            ledgerEntries.forEach(entry -> context.append("- ")
                    .append(entry.getOccurredAt()).append(" | ")
                    .append(entry.getEntryType()).append(" | ")
                    .append(entry.getAmountVnd()).append(" VND")
                    .append(entry.getEntryType() == com.ewa.common.enums.LedgerEntryType.BILL_DEBIT ? " | hóa đơn" : "")
                    .append('\n'));
        }

        context.append("\nCâu hỏi của nhân viên: ").append(message.trim());
        return context.toString();
    }
}