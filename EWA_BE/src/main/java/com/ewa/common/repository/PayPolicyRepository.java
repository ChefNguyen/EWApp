package com.ewa.common.repository;

import com.ewa.common.entity.PayPolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface PayPolicyRepository extends JpaRepository<PayPolicy, UUID> {
    List<PayPolicy> findByEmployerIdAndEffectiveFromLessThanEqualAndEffectiveToIsNullOrEffectiveToGreaterThanEqualOrderByEffectiveFromDesc(
            UUID employerId,
            LocalDate effectiveFrom,
            LocalDate effectiveTo
    );
}
