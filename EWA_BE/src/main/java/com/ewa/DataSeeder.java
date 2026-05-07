package com.ewa;

import com.ewa.common.entity.*;
import com.ewa.common.enums.*;
import com.ewa.common.repository.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final EmployeeRepository employeeRepository;
    private final BankAccountRepository bankAccountRepository;
    private final PayrollPeriodRepository payrollPeriodRepository;
    
    @PersistenceContext
    private EntityManager entityManager;

    @Override
    @Transactional
    public void run(String... args) {
        if (employeeRepository.count() > 0) {
            return; // Already seeded
        }

        // 1. Create Employer
        Employer employer = new Employer();
        employer.setName("Acme Corp");
        employer.setCode("ACME_001");
        employer.setStatus(EmployerStatus.ACTIVE);
        entityManager.persist(employer);

        // 2. Create PayPolicy
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

        // 3. Create Employee NV001
        Employee emp = new Employee();
        emp.setEmployer(employer);
        emp.setEmployeeCode("NV001");
        emp.setFullName("Nguyen Van A");
        emp.setPhone("0901234567");
        emp.setStatus(EmployeeStatus.ACTIVE);
        emp = employeeRepository.save(emp);

        // 4. Create BankAccount for NV001
        BankAccount bank = new BankAccount();
        bank.setId(UUID.fromString("11111111-1111-1111-1111-111111111111"));
        bank.setEmployee(emp);
        bank.setBankCode("VCB");
        bank.setAccountNoEncrypted("0123456789");
        bank.setAccountNoLast4("6789");
        bank.setAccountNameVerified("NGUYEN VAN A");
        bank.setStatus(BankAccountStatus.VERIFIED);
        bankAccountRepository.save(bank);

        // 5. Create PayrollPeriod
        PayrollPeriod period = new PayrollPeriod();
        period.setEmployer(employer);
        period.setStartDate(LocalDate.now().withDayOfMonth(1));
        period.setEndDate(LocalDate.now().withDayOfMonth(LocalDate.now().lengthOfMonth()));
        period.setStatus(PayrollPeriodStatus.OPEN);
        period = payrollPeriodRepository.save(period);

        // 6. Create WorkEntry (Gross salary 15M / 22 days = 681,818 VND/day. Worked 10 days = 6,818,181 VND)
        WorkEntry work = new WorkEntry();
        work.setEmployer(employer);
        work.setEmployee(emp);
        work.setPayrollPeriod(period);
        work.setWorkedUnits(java.math.BigDecimal.valueOf(10.0));
        work.setRatePerUnitVnd(681818L);
        work.setEarnedVnd(6818180L);
        work.setSource(WorkEntrySource.MOCK);
        work.setWorkDate(LocalDate.now());
        entityManager.persist(work);

        System.out.println("✅ Data Seeded for NV001. Limit ~ 5.4M VND. BankAccountId: 11111111-1111-1111-1111-111111111111");
    }
}
