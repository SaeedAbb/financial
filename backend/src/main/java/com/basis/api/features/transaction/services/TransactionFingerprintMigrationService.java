package com.basis.api.features.transaction.services;

import com.basis.api.features.transaction.Transaction;
import com.basis.api.features.transaction.TransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service responsible for migrating existing transactions to include fingerprints.
 * This runs once when the application starts if there are transactions without fingerprints.
 */
@Service
public class TransactionFingerprintMigrationService {
    
    private static final Logger logger = LoggerFactory.getLogger(TransactionFingerprintMigrationService.class);
    
    private final TransactionRepository transactionRepository;
    private final TransactionFingerprintService fingerprintService;
    
    public TransactionFingerprintMigrationService(
            TransactionRepository transactionRepository,
            TransactionFingerprintService fingerprintService) {
        this.transactionRepository = transactionRepository;
        this.fingerprintService = fingerprintService;
    }
    
    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void migrateExistingTransactions() {
        logger.info("Checking for transactions without fingerprints...");
        
        // Find transactions without fingerprints
        List<Transaction> transactionsWithoutFingerprints = transactionRepository
                .findAll()
                .stream()
                .filter(t -> t.getTransactionFingerprint() == null)
                .toList();
        
        if (transactionsWithoutFingerprints.isEmpty()) {
            logger.info("All transactions have fingerprints. No migration needed.");
            return;
        }
        
        logger.info("Found {} transactions without fingerprints. Starting migration...", 
                transactionsWithoutFingerprints.size());
        
        int migratedCount = 0;
        int errorCount = 0;
        
        for (Transaction transaction : transactionsWithoutFingerprints) {
            try {
                String fingerprint = fingerprintService.generateFingerprint(transaction);
                transaction.setTransactionFingerprint(fingerprint);
                transactionRepository.save(transaction);
                migratedCount++;
                
                if (migratedCount % 100 == 0) {
                    logger.info("Migrated {} transactions...", migratedCount);
                }
            } catch (Exception e) {
                logger.error("Failed to migrate transaction {}: {}", transaction.getId(), e.getMessage());
                errorCount++;
            }
        }
        
        logger.info("Transaction fingerprint migration completed. Migrated: {}, Errors: {}", 
                migratedCount, errorCount);
    }
}