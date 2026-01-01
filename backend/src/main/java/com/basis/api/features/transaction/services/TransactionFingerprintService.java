package com.basis.api.features.transaction.services;

import com.basis.api.features.statement.dto.ImportTransactionDTO;
import com.basis.api.features.transaction.Transaction;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.format.DateTimeFormatter;

/**
 * Service for generating unique fingerprints for transactions to prevent duplicate imports.
 * The fingerprint is a SHA-256 hash of the transaction's key attributes.
 */
@Service
public class TransactionFingerprintService {
    
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE;
    
    /**
     * Generates a fingerprint for an import transaction DTO.
     * The fingerprint is based on:
     * - Transaction date
     * - Symbol (or ISIN if available)
     * - Transaction type (BUY/SELL)
     * - Quantity
     * - Price per unit
     * - Provider reference (if available)
     * 
     * @param transaction the import transaction DTO
     * @param userId the user ID (to ensure fingerprints are user-specific)
     * @return a SHA-256 hash string representing the transaction fingerprint
     */
    public String generateFingerprint(ImportTransactionDTO transaction, String userId) {
        StringBuilder fingerprintData = new StringBuilder();
        
        // User ID ensures fingerprints are unique per user
        fingerprintData.append(userId).append("|");
        
        // Date is essential for uniqueness
        fingerprintData.append(transaction.getDate().format(DATE_FORMATTER)).append("|");
        
        // Use ISIN if available, otherwise use symbol
        if (transaction.getIsin() != null && !transaction.getIsin().isEmpty()) {
            fingerprintData.append("ISIN:").append(transaction.getIsin()).append("|");
        } else if (transaction.getRawSymbol() != null && !transaction.getRawSymbol().isEmpty()) {
            fingerprintData.append("SYMBOL:").append(transaction.getRawSymbol()).append("|");
        } else {
            // Fallback to description if no symbol/ISIN
            fingerprintData.append("DESC:").append(transaction.getDescription()).append("|");
        }
        
        // Transaction type
        fingerprintData.append(transaction.getType()).append("|");
        
        // Quantity with proper formatting to avoid floating point issues
        fingerprintData.append(transaction.getQuantity().stripTrailingZeros().toPlainString()).append("|");
        
        // Price per unit
        fingerprintData.append(transaction.getPricePerUnit().stripTrailingZeros().toPlainString()).append("|");
        
        // Total amount as additional verification
        fingerprintData.append(transaction.getTotalAmount().stripTrailingZeros().toPlainString()).append("|");
        
        // Provider reference if available (helps distinguish similar transactions)
        if (transaction.getProviderReference() != null && !transaction.getProviderReference().isEmpty()) {
            fingerprintData.append("REF:").append(transaction.getProviderReference());
        }
        
        return generateSHA256(fingerprintData.toString());
    }
    
    /**
     * Generates a fingerprint for an existing transaction entity.
     * Used for backwards compatibility or verification.
     * 
     * @param transaction the transaction entity
     * @return a SHA-256 hash string representing the transaction fingerprint
     */
    public String generateFingerprint(Transaction transaction) {
        StringBuilder fingerprintData = new StringBuilder();
        
        // User ID ensures fingerprints are unique per user
        fingerprintData.append(transaction.getUserId()).append("|");
        
        // Date
        fingerprintData.append(transaction.getTransactionDate().format(DATE_FORMATTER)).append("|");
        
        // Symbol
        fingerprintData.append("SYMBOL:").append(transaction.getSymbol()).append("|");
        
        // Transaction type
        fingerprintData.append(transaction.getTransactionType().name()).append("|");
        
        // Quantity
        fingerprintData.append(transaction.getQuantity().stripTrailingZeros().toPlainString()).append("|");
        
        // Price per unit
        fingerprintData.append(transaction.getPricePerUnit().stripTrailingZeros().toPlainString()).append("|");
        
        // Total amount
        fingerprintData.append(transaction.getTotalAmount().stripTrailingZeros().toPlainString()).append("|");
        
        // Provider reference if available
        if (transaction.getProviderReference() != null && !transaction.getProviderReference().isEmpty()) {
            fingerprintData.append("REF:").append(transaction.getProviderReference());
        }
        
        return generateSHA256(fingerprintData.toString());
    }
    
    /**
     * Generates a SHA-256 hash from the input string.
     * 
     * @param input the string to hash
     * @return the hexadecimal representation of the hash
     */
    private String generateSHA256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return bytesToHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }
    
    /**
     * Converts a byte array to hexadecimal string.
     * 
     * @param bytes the byte array
     * @return the hexadecimal string
     */
    private String bytesToHex(byte[] bytes) {
        StringBuilder result = new StringBuilder();
        for (byte b : bytes) {
            result.append(String.format("%02x", b));
        }
        return result.toString();
    }
}