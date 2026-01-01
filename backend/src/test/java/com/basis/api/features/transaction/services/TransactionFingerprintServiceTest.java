package com.basis.api.features.transaction.services;

import com.basis.api.features.statement.dto.ImportTransactionDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

class TransactionFingerprintServiceTest {
    
    private TransactionFingerprintService fingerprintService;
    
    @BeforeEach
    void setUp() {
        fingerprintService = new TransactionFingerprintService();
    }
    
    @Test
    void testGenerateFingerprintForImportTransaction() {
        // Arrange
        ImportTransactionDTO transaction = new ImportTransactionDTO();
        transaction.setDate(LocalDate.of(2025, 1, 1));
        transaction.setIsin("US0378331005");
        transaction.setType("BUY");
        transaction.setQuantity(new BigDecimal("10.5"));
        transaction.setPricePerUnit(new BigDecimal("150.25"));
        transaction.setTotalAmount(new BigDecimal("1577.625"));
        transaction.setProviderReference("TRX123456");
        
        String userId = "user123";
        
        // Act
        String fingerprint = fingerprintService.generateFingerprint(transaction, userId);
        
        // Assert
        assertNotNull(fingerprint);
        assertEquals(64, fingerprint.length()); // SHA-256 produces 64-character hex string
    }
    
    @Test
    void testDifferentUsersGetDifferentFingerprints() {
        // Arrange
        ImportTransactionDTO transaction = new ImportTransactionDTO();
        transaction.setDate(LocalDate.of(2025, 1, 1));
        transaction.setRawSymbol("AAPL");
        transaction.setType("BUY");
        transaction.setQuantity(new BigDecimal("10"));
        transaction.setPricePerUnit(new BigDecimal("150"));
        transaction.setTotalAmount(new BigDecimal("1500"));
        
        // Act
        String fingerprint1 = fingerprintService.generateFingerprint(transaction, "user1");
        String fingerprint2 = fingerprintService.generateFingerprint(transaction, "user2");
        
        // Assert
        assertNotEquals(fingerprint1, fingerprint2, "Different users should get different fingerprints");
    }
    
    @Test
    void testSameTransactionProducesSameFingerprint() {
        // Arrange
        ImportTransactionDTO transaction1 = new ImportTransactionDTO();
        transaction1.setDate(LocalDate.of(2025, 1, 1));
        transaction1.setIsin("US0378331005");
        transaction1.setType("BUY");
        transaction1.setQuantity(new BigDecimal("10.5"));
        transaction1.setPricePerUnit(new BigDecimal("150.25"));
        transaction1.setTotalAmount(new BigDecimal("1577.625"));
        
        ImportTransactionDTO transaction2 = new ImportTransactionDTO();
        transaction2.setDate(LocalDate.of(2025, 1, 1));
        transaction2.setIsin("US0378331005");
        transaction2.setType("BUY");
        transaction2.setQuantity(new BigDecimal("10.5"));
        transaction2.setPricePerUnit(new BigDecimal("150.25"));
        transaction2.setTotalAmount(new BigDecimal("1577.625"));
        
        String userId = "user123";
        
        // Act
        String fingerprint1 = fingerprintService.generateFingerprint(transaction1, userId);
        String fingerprint2 = fingerprintService.generateFingerprint(transaction2, userId);
        
        // Assert
        assertEquals(fingerprint1, fingerprint2, "Same transaction details should produce same fingerprint");
    }
    
    @Test
    void testDifferentDatesProduceDifferentFingerprints() {
        // Arrange
        ImportTransactionDTO transaction1 = new ImportTransactionDTO();
        transaction1.setDate(LocalDate.of(2025, 1, 1));
        transaction1.setRawSymbol("AAPL");
        transaction1.setType("BUY");
        transaction1.setQuantity(new BigDecimal("10"));
        transaction1.setPricePerUnit(new BigDecimal("150"));
        transaction1.setTotalAmount(new BigDecimal("1500"));
        
        ImportTransactionDTO transaction2 = new ImportTransactionDTO();
        transaction2.setDate(LocalDate.of(2025, 1, 2)); // Different date
        transaction2.setRawSymbol("AAPL");
        transaction2.setType("BUY");
        transaction2.setQuantity(new BigDecimal("10"));
        transaction2.setPricePerUnit(new BigDecimal("150"));
        transaction2.setTotalAmount(new BigDecimal("1500"));
        
        String userId = "user123";
        
        // Act
        String fingerprint1 = fingerprintService.generateFingerprint(transaction1, userId);
        String fingerprint2 = fingerprintService.generateFingerprint(transaction2, userId);
        
        // Assert
        assertNotEquals(fingerprint1, fingerprint2, "Different dates should produce different fingerprints");
    }
}