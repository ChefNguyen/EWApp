package com.ewa.common.entity;

import com.ewa.common.enums.WorkUnitType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "pay_policies")
@Getter
@Setter
@NoArgsConstructor
public class PayPolicy extends BaseAuditable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employer_id", nullable = false)
    private Employer employer;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "limit_percent", nullable = false)
    private int limitPercent;

    @Enumerated(EnumType.STRING)
    @Column(name = "work_unit_type", nullable = false)
    private WorkUnitType workUnitType;

    @Column(name = "standard_units", nullable = false)
    private int standardUnits;

    @Column(name = "rounding_unit_vnd", nullable = false)
    private long roundingUnitVnd;

    @Column(name = "fee_policy_code", nullable = false)
    private String feePolicyCode;

    @Column(name = "effective_from", nullable = false)
    private LocalDate effectiveFrom;

    @Column(name = "effective_to")
    private LocalDate effectiveTo;
}
