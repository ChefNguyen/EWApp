package com.ewa.modules.utility;

import lombok.Getter;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory seed data store that mirrors the mock data in EWA_FE/src/services/mockApi.ts.
 * Thread-safe for paid bill tracking.
 */
@Component
public class MockDataStore {

    /** Valid top-up denominations in VND. */
    public static final List<Long> DENOMINATIONS = List.of(
            10_000L, 20_000L, 50_000L, 100_000L, 200_000L, 500_000L
    );

    /** Phone prefix → carrier mapping (Vietnam). */
    public static final Map<String, String> PREFIX_TO_CARRIER = Map.ofEntries(
            Map.entry("032", "Viettel"), Map.entry("033", "Viettel"), Map.entry("034", "Viettel"),
            Map.entry("035", "Viettel"), Map.entry("036", "Viettel"), Map.entry("037", "Viettel"),
            Map.entry("038", "Viettel"), Map.entry("039", "Viettel"),
            Map.entry("070", "Mobifone"), Map.entry("076", "Mobifone"), Map.entry("077", "Mobifone"),
            Map.entry("078", "Mobifone"), Map.entry("079", "Mobifone"),
            Map.entry("056", "Vietnamobile"), Map.entry("058", "Vietnamobile"),
            Map.entry("059", "Gmobile")
    );

    /**
     * Sample utility bills (seeded).
     * Key = billKey, Value = BillRecord.
     */
    @Getter
    private final Map<String, BillRecord> bills = Map.of(
            "ELEC-001", new BillRecord("ELEC-001", "electricity", "EVN001",
                    "Nguyễn Văn A", "123 Lê Lợi, Q1, HCM", 350_000L, "05/2025", "UNPAID"),
            "ELEC-002", new BillRecord("ELEC-002", "electricity", "EVN002",
                    "Trần Thị B", "456 Trần Hưng Đạo, Q5, HCM", 520_000L, "05/2025", "UNPAID"),
            "WATER-001", new BillRecord("WATER-001", "water", "SAWACO001",
                    "Lê Văn C", "789 Nguyễn Trãi, Q1, HCM", 180_000L, "05/2025", "UNPAID"),
            "INTERNET-001", new BillRecord("INTERNET-001", "internet", "VNPT001",
                    "Phạm Thị D", "321 Hai Bà Trưng, Q3, HCM", 250_000L, "05/2025", "UNPAID")
    );

    /** Track paid billKeys to prevent duplicate payments. */
    private final Set<String> paidBillKeys = ConcurrentHashMap.newKeySet();

    public boolean isBillPaid(String billKey) {
        return paidBillKeys.contains(billKey);
    }

    public void markBillPaid(String billKey) {
        paidBillKeys.add(billKey);
    }

    public boolean isValidDenomination(long denomination) {
        return DENOMINATIONS.contains(denomination);
    }

    public String detectCarrier(String phoneNumber) {
        // Normalize: remove +84 prefix
        String normalized = phoneNumber.startsWith("+84")
                ? "0" + phoneNumber.substring(3)
                : phoneNumber;
        if (normalized.length() >= 5) {
            String prefix = normalized.substring(0, 3);
            return PREFIX_TO_CARRIER.getOrDefault(prefix, "Unknown");
        }
        return "Unknown";
    }

    @Getter
    public static class BillRecord {
        private final String billKey;
        private final String serviceType;
        private final String customerId;
        private final String customerName;
        private final String address;
        private final long amount;
        private final String period;
        private final String status;

        public BillRecord(String billKey, String serviceType, String customerId,
                          String customerName, String address, long amount,
                          String period, String status) {
            this.billKey = billKey;
            this.serviceType = serviceType;
            this.customerId = customerId;
            this.customerName = customerName;
            this.address = address;
            this.amount = amount;
            this.period = period;
            this.status = status;
        }
    }
}
