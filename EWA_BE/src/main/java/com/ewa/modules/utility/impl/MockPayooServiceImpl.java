package com.ewa.modules.utility.impl;

import com.ewa.common.entity.Employee;
import com.ewa.common.entity.LedgerEntry;
import com.ewa.common.entity.PayrollPeriod;
import com.ewa.common.enums.LedgerEntryType;
import com.ewa.common.enums.LedgerReferenceType;
import com.ewa.common.enums.PayrollPeriodStatus;
import com.ewa.common.repository.EmployeeRepository;
import com.ewa.common.repository.LedgerEntryRepository;
import com.ewa.common.repository.PayrollPeriodRepository;
import com.ewa.modules.payment.AvailableLimitService;
import com.ewa.modules.utility.MockDataStore;
import com.ewa.modules.utility.UtilityPaymentService;
import com.ewa.modules.utility.dto.BillPayRequest;
import com.ewa.modules.utility.dto.BillPayResponse;
import com.ewa.modules.utility.dto.BillQueryRequest;
import com.ewa.modules.utility.dto.BillQueryResponse;
import com.ewa.modules.utility.dto.TopupRequest;
import com.ewa.modules.utility.dto.TopupResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "ewa.utility.provider", havingValue = "mock", matchIfMissing = true)
public class MockPayooServiceImpl implements UtilityPaymentService {

    @Value("${ewa.utility.mock.failure-rate:0.05}")
    private double failureRate;

    @Value("${ewa.utility.mock.min-delay-ms:1000}")
    private long minDelayMs;

    @Value("${ewa.utility.mock.max-delay-ms:2000}")
    private long maxDelayMs;

    private final EmployeeRepository employeeRepository;
    private final PayrollPeriodRepository payrollPeriodRepository;
    private final LedgerEntryRepository ledgerEntryRepository;
    private final AvailableLimitService availableLimitService;
    private final MockDataStore mockDataStore;

    // Injectable for deterministic testing
    private java.util.function.Supplier<Double> randomSupplier = Math::random;
    private java.util.function.LongSupplier delayProvider = () ->
            (long) (minDelayMs + Math.random() * (maxDelayMs - minDelayMs));

    /** Package-visible for test injection. */
    void setRandomSupplier(java.util.function.Supplier<Double> supplier) {
        this.randomSupplier = supplier;
    }

    void setDelayProvider(java.util.function.LongSupplier provider) {
        this.delayProvider = provider;
    }

    @Override
    @Transactional
    public TopupResponse topupPhone(TopupRequest request) {
        simulateDelay();

        Employee employee = employeeRepository.findByEmployeeCode(request.getEmployeeCode())
                .orElseThrow(() -> new IllegalArgumentException("Mã nhân viên không tồn tại"));

        // Validate denomination
        if (!mockDataStore.isValidDenomination(request.getDenomination())) {
            return TopupResponse.builder()
                    .success(false)
                    .error("Mệnh giá không hợp lệ. Các mệnh giá hỗ trợ: " + MockDataStore.DENOMINATIONS)
                    .build();
        }

        // Detect carrier
        String carrier = mockDataStore.detectCarrier(request.getPhoneNumber());
        if ("Unknown".equals(carrier)) {
            return TopupResponse.builder()
                    .success(false)
                    .error("Đầu số điện thoại không hợp lệ hoặc nhà mạng không được hỗ trợ")
                    .build();
        }

        // Check limit
        long available = availableLimitService.calculateAvailableLimit(request.getEmployeeCode());
        if (request.getDenomination() > available) {
            return TopupResponse.builder()
                    .success(false)
                    .error(String.format("Hạn mức không đủ. Còn lại: %d VND, yêu cầu: %d VND",
                            available, request.getDenomination()))
                    .build();
        }

        // Simulate random failure
        if (shouldFail()) {
            log.warn("[MockPayoo] Simulated topup failure phone={}", request.getPhoneNumber());
            return TopupResponse.builder()
                    .success(false)
                    .error("Lỗi nhà mạng, vui lòng thử lại")
                    .build();
        }

        // Write ledger entry
        PayrollPeriod payrollPeriod = getOpenPayrollPeriod(employee);
        String txnId = "TOPUP-" + UUID.randomUUID();
        writeLedgerEntry(employee, payrollPeriod, LedgerEntryType.TOPUP_DEBIT,
                request.getDenomination(), UUID.nameUUIDFromBytes(txnId.getBytes()));

        long newLimit = availableLimitService.calculateAvailableLimit(request.getEmployeeCode());
        log.info("[MockPayoo] Topup SUCCESS phone={} amount={} carrier={}", request.getPhoneNumber(),
                request.getDenomination(), carrier);

        return TopupResponse.builder()
                .success(true)
                .transactionId(txnId)
                .newLimit(newLimit)
                .build();
    }

    @Override
    public BillQueryResponse queryBill(BillQueryRequest request) {
        simulateDelay();

        // Find bill by serviceType + customerId
        MockDataStore.BillRecord bill = mockDataStore.getBills().values().stream()
                .filter(b -> b.getServiceType().equalsIgnoreCase(request.getServiceType())
                        && b.getCustomerId().equalsIgnoreCase(request.getCustomerId()))
                .findFirst()
                .orElse(null);

        if (bill == null) {
            return BillQueryResponse.builder()
                    .error("Không tìm thấy hóa đơn cho khách hàng " + request.getCustomerId())
                    .build();
        }

        String status = mockDataStore.isBillPaid(bill.getBillKey()) ? "PAID" : bill.getStatus();

        return BillQueryResponse.builder()
                .billKey(bill.getBillKey())
                .customerName(bill.getCustomerName())
                .address(bill.getAddress())
                .amount(bill.getAmount())
                .period(bill.getPeriod())
                .status(status)
                .build();
    }

    @Override
    @Transactional
    public BillPayResponse payBill(BillPayRequest request) {
        simulateDelay();

        Employee employee = employeeRepository.findByEmployeeCode(request.getEmployeeCode())
                .orElseThrow(() -> new IllegalArgumentException("Mã nhân viên không tồn tại"));

        MockDataStore.BillRecord bill = mockDataStore.getBills().get(request.getBillKey());
        if (bill == null) {
            return BillPayResponse.builder()
                    .success(false)
                    .error("Không tìm thấy hóa đơn: " + request.getBillKey())
                    .build();
        }

        // Duplicate payment protection
        if (mockDataStore.isBillPaid(request.getBillKey())) {
            return BillPayResponse.builder()
                    .success(false)
                    .error("Hóa đơn này đã được thanh toán")
                    .build();
        }

        // Check limit
        long available = availableLimitService.calculateAvailableLimit(request.getEmployeeCode());
        if (bill.getAmount() > available) {
            return BillPayResponse.builder()
                    .success(false)
                    .error(String.format("Hạn mức không đủ. Còn lại: %d VND, yêu cầu: %d VND",
                            available, bill.getAmount()))
                    .build();
        }

        // Simulate random failure
        if (shouldFail()) {
            log.warn("[MockPayoo] Simulated bill payment failure billKey={}", request.getBillKey());
            return BillPayResponse.builder()
                    .success(false)
                    .error("Lỗi hệ thống, vui lòng thử lại")
                    .build();
        }

        // Write ledger entry
        PayrollPeriod payrollPeriod = getOpenPayrollPeriod(employee);
        String txnId = "BILL-" + UUID.randomUUID();
        writeLedgerEntry(employee, payrollPeriod, LedgerEntryType.BILL_DEBIT,
                bill.getAmount(), UUID.nameUUIDFromBytes(txnId.getBytes()));

        // Mark bill as paid
        mockDataStore.markBillPaid(request.getBillKey());

        long newLimit = availableLimitService.calculateAvailableLimit(request.getEmployeeCode());
        log.info("[MockPayoo] Bill payment SUCCESS billKey={} amount={}", request.getBillKey(), bill.getAmount());

        return BillPayResponse.builder()
                .success(true)
                .transactionId(txnId)
                .newLimit(newLimit)
                .build();
    }

    // ─── helpers ────────────────────────────────────────────────────────────────

    private void simulateDelay() {
        try {
            long delay = delayProvider.getAsLong();
            if (delay > 0) {
                Thread.sleep(delay);
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    private boolean shouldFail() {
        return randomSupplier.get() < failureRate;
    }

    private PayrollPeriod getOpenPayrollPeriod(Employee employee) {
        return payrollPeriodRepository
                .findTopByEmployerIdAndStatusOrderByStartDateDesc(
                        employee.getEmployer().getId(), PayrollPeriodStatus.OPEN)
                .orElseThrow(() -> new IllegalStateException("Không tìm thấy kỳ lương đang mở"));
    }

    private void writeLedgerEntry(Employee employee, PayrollPeriod payrollPeriod,
                                   LedgerEntryType type, long amount, UUID referenceId) {
        LedgerEntry entry = new LedgerEntry();
        entry.setEmployer(employee.getEmployer());
        entry.setEmployee(employee);
        entry.setPayrollPeriod(payrollPeriod);
        entry.setEntryType(type);
        entry.setAmountVnd(amount);
        entry.setReferenceType(LedgerReferenceType.MANUAL);
        entry.setReferenceId(referenceId);
        entry.setOccurredAt(Instant.now());
        ledgerEntryRepository.save(entry);
    }
}
