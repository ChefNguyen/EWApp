package com.ewa.modules.withdrawal.impl;

import com.ewa.common.entity.LedgerEntry;
import com.ewa.common.entity.Withdrawal;
import com.ewa.common.enums.LedgerEntryType;
import com.ewa.common.enums.LedgerReferenceType;
import com.ewa.common.repository.LedgerEntryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Optional;

/**
 * Centralised service for writing {@link LedgerEntry} rows tied to a
 * {@link com.ewa.common.entity.Withdrawal}.
 *
 * <p>Both the local mock path ({@code SePayWithdrawalServiceImpl}) and the
 * webhook path ({@code SePayWebhookProcessor}) delegate here so that:
 * <ul>
 *   <li>Ledger writes are never duplicated (idempotency guard)</li>
 *   <li>All withdrawal ledger logic lives in one place</li>
 * </ul>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class WithdrawalLedgerService {

    private final LedgerEntryRepository ledgerEntryRepository;

    /**
     * Writes WITHDRAW_DEBIT ledger entry for a given withdrawal.
     * Idempotent – skips if an entry already exists for this withdrawal.
     *
     * @param withdrawal non-null withdrawal entity
     * @return {@code true} if a new entry was written, {@code false} if skipped
     */
    public boolean writeWithdrawDebit(Withdrawal withdrawal) {
        return writeEntry(withdrawal, LedgerEntryType.WITHDRAW_DEBIT, withdrawal.getAmountRequestedVnd());
    }

    /**
     * Writes FEE_DEBIT ledger entry for a given withdrawal.
     * Idempotent – skips if an entry already exists for this withdrawal.
     *
     * @param withdrawal non-null withdrawal entity
     * @return {@code true} if a new entry was written, {@code false} if skipped
     */
    public boolean writeFeeDebit(Withdrawal withdrawal) {
        if (withdrawal.getFeeVnd() <= 0) {
            return false;
        }
        return writeEntry(withdrawal, LedgerEntryType.FEE_DEBIT, withdrawal.getFeeVnd());
    }

    /**
     * Writes both WITHDRAW_DEBIT and FEE_DEBIT entries.
     * Idempotent – each type is guarded independently.
     */
    public void writeAllEntries(Withdrawal withdrawal) {
        writeWithdrawDebit(withdrawal);
        writeFeeDebit(withdrawal);
    }

    /**
     * Checks whether a WITHDRAW_DEBIT entry already exists for the given withdrawal.
     */
    public boolean hasWithdrawDebit(Withdrawal withdrawal) {
        return ledgerEntryRepository.existsByEntryTypeAndReferenceTypeAndReferenceId(
                LedgerEntryType.WITHDRAW_DEBIT,
                LedgerReferenceType.WITHDRAWAL,
                withdrawal.getId());
    }

    private boolean writeEntry(Withdrawal withdrawal, LedgerEntryType type, long amount) {
        boolean exists = ledgerEntryRepository.existsByEntryTypeAndReferenceTypeAndReferenceId(
                type, LedgerReferenceType.WITHDRAWAL, withdrawal.getId());
        if (exists) {
            log.debug("[WithdrawalLedger] Entry already exists type={} withdrawalId={}", type, withdrawal.getId());
            return false;
        }

        LedgerEntry entry = new LedgerEntry();
        entry.setEmployer(withdrawal.getEmployer());
        entry.setEmployee(withdrawal.getEmployee());
        entry.setPayrollPeriod(withdrawal.getPayrollPeriod());
        entry.setEntryType(type);
        entry.setAmountVnd(amount);
        entry.setReferenceType(LedgerReferenceType.WITHDRAWAL);
        entry.setReferenceId(withdrawal.getId());
        entry.setOccurredAt(Instant.now());
        ledgerEntryRepository.save(entry);

        log.info("[WithdrawalLedger] Saved ledgerEntry type={} amount={} withdrawalId={}",
                type, amount, withdrawal.getId());
        return true;
    }
}
