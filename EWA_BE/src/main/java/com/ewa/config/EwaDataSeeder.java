package com.ewa.config;

import com.ewa.common.entity.Employee;
import com.ewa.common.entity.Employer;
import com.ewa.common.enums.EmployeeStatus;
import com.ewa.common.enums.EmployerStatus;
import com.ewa.common.repository.EmployeeRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

@Configuration
@RequiredArgsConstructor
public class EwaDataSeeder {

    private final DataSeederService dataSeederService;
    private final TransactionTemplate transactionTemplate;

    @Bean
    public CommandLineRunner loadData() {
        return args -> transactionTemplate.execute(status -> {
            dataSeederService.seedIfEmpty();
            return null;
        });
    }

    @Component
    @RequiredArgsConstructor
    public static class DataSeederService {

        private final EntityManager entityManager;
        private final EmployeeRepository employeeRepository;

        public void seedIfEmpty() {
            if (employeeRepository.count() == 0) {
                // Create dummy employer
                Employer employer = new Employer();
                employer.setCode("EMP001");
                employer.setName("Company XYZ");
                employer.setStatus(EmployerStatus.ACTIVE);
                entityManager.persist(employer);

                // Create dummy employee NV001
                Employee nv001 = new Employee();
                nv001.setEmployeeCode("NV001");
                nv001.setFullName("Nguyễn Văn A");
                nv001.setPhone("0901234567");
                nv001.setEmployer(employer);
                nv001.setStatus(EmployeeStatus.ACTIVE);
                employeeRepository.save(nv001);

                // Create dummy employee NV002
                Employee nv002 = new Employee();
                nv002.setEmployeeCode("NV002");
                nv002.setFullName("Trần Thị B");
                nv002.setPhone("0909876543");
                nv002.setEmployer(employer);
                nv002.setStatus(EmployeeStatus.ACTIVE);
                employeeRepository.save(nv002);

                System.out.println("✅ Seeded dummy employees NV001 and NV002");
            }

            if (employeeRepository.findByEmployeeCode("NV003").isEmpty()) {
                Employer employer = employeeRepository.findByEmployeeCode("NV001").map(Employee::getEmployer).orElse(null);
                if (employer != null) {
                    Employee nv003 = new Employee();
                    nv003.setEmployeeCode("NV003");
                    nv003.setFullName("Lê Văn C");
                    nv003.setPhone("0912345678");
                    nv003.setEmployer(employer);
                    nv003.setStatus(EmployeeStatus.ACTIVE);
                    employeeRepository.save(nv003);
                    System.out.println("✅ Seeded dummy employee NV003");
                }
            }

            if (employeeRepository.findByEmployeeCode("NV004").isEmpty()) {
                Employer employer = employeeRepository.findByEmployeeCode("NV001").map(Employee::getEmployer).orElse(null);
                if (employer != null) {
                    Employee nv004 = new Employee();
                    nv004.setEmployeeCode("NV004");
                    nv004.setFullName("Phạm Thị D");
                    nv004.setPhone("0987654321");
                    nv004.setEmployer(employer);
                    nv004.setStatus(EmployeeStatus.ACTIVE);
                    employeeRepository.save(nv004);
                    System.out.println("✅ Seeded dummy employee NV004");
                }
            }
        }
    }
}
