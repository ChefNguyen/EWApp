package com.ewa.common.entity;

import com.ewa.common.enums.WorkEntrySource;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "work_entries", indexes = {
        @Index(name = "idx_work_entries_emp_period", columnList = "employee_id, payroll_period_id"),
        @Index(name = "idx_work_entries_employer_period", columnList = "employer_id, payroll_period_id")
})
@Getter
@Setter
@NoArgsConstructor
public class WorkEntry extends BaseAuditable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employer_id", nullable = false)
    private Employer employer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payroll_period_id", nullable = false)
    private PayrollPeriod payrollPeriod;

    @Column(name = "work_date")
    private LocalDate workDate;

    @Column(name = "worked_units", nullable = false, precision = 10, scale = 2)
    private BigDecimal workedUnits;

    @Column(name = "rate_per_unit_vnd", nullable = false)
    private long ratePerUnitVnd;

    @Column(name = "earned_vnd", nullable = false)
    private long earnedVnd;

    @Enumerated(EnumType.STRING)
    @Column(name = "source", nullable = false)
    private WorkEntrySource source;

    @Column(name = "metadata", columnDefinition = "jsonb")
    private String metadata;
}
