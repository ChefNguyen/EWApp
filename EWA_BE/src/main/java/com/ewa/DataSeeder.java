package com.ewa;

import com.ewa.common.entity.*;
import com.ewa.common.enums.*;
import com.ewa.common.repository.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private static final UUID NV001_BANK_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID NV002_BANK_ID = UUID.fromString("22222222-2222-2222-2222-222222222222");
    private static final UUID NV003_BANK_ID = UUID.fromString("33333333-3333-3333-3333-333333333333");
    private static final UUID NV004_BANK_ID = UUID.fromString("44444444-4444-4444-4444-444444444444");

    private final EmployeeRepository employeeRepository;
    private final BankAccountRepository bankAccountRepository;
    private final PayrollPeriodRepository payrollPeriodRepository;
    private final PasswordEncoder passwordEncoder;

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    @Transactional
    public void run(String... args) {
        try {
            entityManager.createNativeQuery("ALTER TABLE ledger_entries DROP CONSTRAINT IF EXISTS ledger_entries_entry_type_check").executeUpdate();
            System.out.println("✅ Đã cập nhật (Drop) constraint của bảng ledger_entries.");
        } catch (Exception ignored) {
        }

        if (employeeRepository.findByEmployeeCode("NV004").isPresent() && bankAccountRepository.findById(NV001_BANK_ID).isPresent()) {
            System.out.println("========== [THÔNG BÁO] ==========");
            System.out.println("✅ Seed data NV001-NV004 đã tồn tại.");
            System.out.println("BankAccount NV001: " + NV001_BANK_ID);
            System.out.println("=================================");
            return;
        }

        entityManager.createNativeQuery("DELETE FROM work_entries").executeUpdate();
        entityManager.createNativeQuery("DELETE FROM payout_attempts").executeUpdate();
        entityManager.createNativeQuery("DELETE FROM withdrawals").executeUpdate();
        entityManager.createNativeQuery("DELETE FROM ledger_entries").executeUpdate();
        entityManager.createNativeQuery("DELETE FROM bank_accounts").executeUpdate();
        entityManager.createNativeQuery("DELETE FROM payroll_periods").executeUpdate();
        entityManager.createNativeQuery("DELETE FROM employees").executeUpdate();
        entityManager.createNativeQuery("DELETE FROM pay_policies").executeUpdate();
        entityManager.createNativeQuery("DELETE FROM employers").executeUpdate();
        entityManager.flush();
        entityManager.clear(); // Quan trọng: Làm sạch cache để tránh xung đột ID cũ/mới

        Employer employer = new Employer();
        employer.setName("Acme Corp");
        employer.setCode("ACME_001");
        employer.setStatus(EmployerStatus.ACTIVE);
        entityManager.persist(employer);

        PayPolicy policy = new PayPolicy();
        policy.setEmployer(employer);
        policy.setName("Standard Policy");
        policy.setLimitPercent(80);
        policy.setWorkUnitType(WorkUnitType.DAY);
        policy.setStandardUnits(22);
        policy.setRoundingUnitVnd(1000L);
        policy.setFeePolicyCode("DEFAULT_FEE");
        policy.setEffectiveFrom(LocalDate.of(2020, 1, 1));
        entityManager.persist(policy);

        PayrollPeriod period = new PayrollPeriod();
        period.setEmployer(employer);
        period.setPeriodCode(LocalDate.now().getYear() + "-" + String.format("%02d", LocalDate.now().getMonthValue()));
        period.setStartDate(LocalDate.now().withDayOfMonth(1));
        period.setEndDate(LocalDate.now().withDayOfMonth(LocalDate.now().lengthOfMonth()));
        period.setStatus(PayrollPeriodStatus.OPEN);
        period = payrollPeriodRepository.save(period);

        seedEmployee(employer, period, "NV001", "Nguyễn Văn A", "0901234567", "VCB", "0987654321", "NGUYEN VAN A", 22, 909091L, "nv001", NV001_BANK_ID);
        seedEmployee(employer, period, "NV002", "Trần Thị B", "0909876543", "VCB", "1234567890", "TRAN THI B", 20, 681818L, "nv002", NV002_BANK_ID);
        seedEmployee(employer, period, "NV003", "Lê Văn C", "0912345678", "MB", "5555666677", "LE VAN C", 10, 454545L, "nv003", NV003_BANK_ID);
        seedEmployee(employer, period, "NV004", "Phạm Thị D", "0987654321", "ACB", "9999888877", "PHAM THI D", 5, 227273L, "nv004", NV004_BANK_ID);

        System.out.println("========== [THÔNG BÁO] ==========");
        System.out.println("✅ Seed thành công dữ liệu NV001-NV004.");
        System.out.println("BankAccount NV001 (compat FE): " + NV001_BANK_ID);
        System.out.println("=================================");
    }

    private void seedEmployee(
            Employer employer,
            PayrollPeriod period,
            String employeeCode,
            String fullName,
            String phone,
            String bankCode,
            String accountNo,
            String accountName,
            int workedDays,
            long dailyRate,
            String password,
            UUID bankId
    ) {
        Employee employee = new Employee();
        employee.setEmployer(employer);
        employee.setEmployeeCode(employeeCode);
        employee.setFullName(fullName);
        employee.setPhone(phone);
        employee.setStatus(EmployeeStatus.ACTIVE);
        employee.setPasswordHash(passwordEncoder.encode(password));
        employee = employeeRepository.save(employee);

        // Dùng Native SQL để ép ID xuyên qua @GeneratedValue của Hibernate
        entityManager.createNativeQuery("INSERT INTO bank_accounts (id, employee_id, bank_code, account_no_encrypted, account_no_last4, account_name_verified, status, created_at, updated_at) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
                .setParameter(1, bankId)
                .setParameter(2, employee.getId())
                .setParameter(3, bankCode)
                .setParameter(4, accountNo)
                .setParameter(5, accountNo.substring(accountNo.length() - 4))
                .setParameter(6, accountName)
                .setParameter(7, BankAccountStatus.VERIFIED.name())
                .setParameter(8, java.time.Instant.now())
                .setParameter(9, java.time.Instant.now())
                .executeUpdate();

        WorkEntry work = new WorkEntry();
        work.setEmployer(employer);
        work.setEmployee(employee);
        work.setPayrollPeriod(period);
        work.setWorkedUnits(BigDecimal.valueOf(workedDays));
        work.setRatePerUnitVnd(dailyRate);
        work.setEarnedVnd(dailyRate * workedDays);
        work.setSource(WorkEntrySource.MOCK);
        work.setWorkDate(LocalDate.now());
        entityManager.persist(work);
    }
}
