package com.ewa.common.repository;

import com.ewa.common.entity.Withdrawal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WithdrawalRepository extends JpaRepository<Withdrawal, UUID> {
    Optional<Withdrawal> findByIdAndEmployeeEmployeeCode(UUID id, String employeeCode);

    List<Withdrawal> findByEmployeeEmployeeCodeOrderByCreatedAtDesc(String employeeCode);
}
