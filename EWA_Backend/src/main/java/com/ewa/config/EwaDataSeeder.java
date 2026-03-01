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
import org.springframework.transaction.annotation.Transactional;

@Configuration
@RequiredArgsConstructor
public class EwaDataSeeder {

    private final DataSeederService dataSeederService;

    @Bean
    public CommandLineRunner loadData() {
        return args -> dataSeederService.seedIfEmpty();
    }

    @Component
    @RequiredArgsConstructor
    public static class DataSeederService {

        private final EntityManager entityManager;
        private final EmployeeRepository employeeRepository;

        @Transactional
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
        }
    }
}
