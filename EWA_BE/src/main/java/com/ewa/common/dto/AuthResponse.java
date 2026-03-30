package com.ewa.common.dto;

import com.ewa.common.entity.Employee;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private EmployeeResponse employee;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmployeeResponse {
        private String id;
        private String name;
        private String phone;
        // Mocking the salary data to match frontend requirements for Sprint 1
        private double grossSalary;
        private int workingDays;
        private double advancedAmount;
        private Object linkedBank;

        public static EmployeeResponse fromEntity(Employee employee, double grossSalary, int workingDays,
                double advancedAmount, Object linkedBank) {
            return EmployeeResponse.builder()
                    .id(employee.getEmployeeCode()) // Frontend uses code as ID currently
                    .name(employee.getFullName())
                    .phone(employee.getPhone())
                    .grossSalary(grossSalary)
                    .workingDays(workingDays)
                    .advancedAmount(advancedAmount)
                    .linkedBank(linkedBank) // Mock bank for now
                    .build();
        }
    }
}
