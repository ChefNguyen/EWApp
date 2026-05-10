package com.ewa.common.repository;

import com.ewa.common.entity.BankAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BankAccountRepository extends JpaRepository<BankAccount, UUID> {
    Optional<BankAccount> findByIdAndEmployeeEmployeeCode(UUID id, String employeeCode);
    List<BankAccount> findByEmployeeEmployeeCodeOrderByCreatedAtDesc(String employeeCode);
}
