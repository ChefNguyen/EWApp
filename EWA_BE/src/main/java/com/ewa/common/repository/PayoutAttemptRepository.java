package com.ewa.common.repository;

import com.ewa.common.entity.PayoutAttempt;
import com.ewa.common.enums.PaymentProvider;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PayoutAttemptRepository extends JpaRepository<PayoutAttempt, UUID> {
    Optional<PayoutAttempt> findTopByWithdrawalIdOrderByAttemptNoDesc(UUID withdrawalId);

    Optional<PayoutAttempt> findByProviderAndExternalTxnId(PaymentProvider provider, String externalTxnId);
}
