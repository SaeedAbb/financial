package com.basis.api.features.transaction.services;

import com.basis.api.features.statement.dto.ImportTransactionDTO;
import com.basis.api.features.transaction.Transaction;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
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
    
    private static final Logger logger = LoggerFactory.getLogger(TransactionFingerprintService.class);
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE;

    // Precision for rounding values before fingerprint generation
    // This prevents AI parsing variations from causing duplicate detection failures
    // Using aggressive rounding (2 decimal places) because AI can extract slightly different
    // values from the same document on different runs (e.g., 0.180249 vs 0.180342)
    private static final int QUANTITY_PRECISION = 2;  // 2 decimal places for quantities
    private static final int AMOUNT_PRECISION = 2;    // 2 decimal places for amounts
    
    /**
     * Generates a fingerprint for an import transaction DTO.
     * The fingerprint is based on:
     * - User ID (to ensure fingerprints are user-specific)
     * - Transaction date
     * - Symbol (or ISIN if available)
     * - Transaction type (BUY/SELL)
     * - Quantity (rounded to 2 decimal places)
     * - Total amount (rounded to 2 decimal places) - most stable value from statements
     * - Provider reference (if available)
     *
     * Note: Price per unit is intentionally excluded because it's derived from
     * quantity and total amount, and AI parsing can produce slightly different
     * calculated values between runs.
     *
     * @param transaction the import transaction DTO
     * @param userId the user ID (to ensure fingerprints are user-specific)
     * @return a SHA-256 hash string representing the transaction fingerprint
     */
    public String generateFingerprint(ImportTransactionDTO transaction, String userId) {
        StringBuilder fingerprintData = new StringBuilder();
        
        logger.debug("Generating fingerprint for transaction: date={}, symbol={}, type={}, quantity={}, price={}",
            transaction.getDate(), transaction.getRawSymbol(), transaction.getType(),
            transaction.getQuantity(), transaction.getPricePerUnit());
        
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
        
        // Quantity with aggressive rounding to avoid AI parsing precision variations
        fingerprintData.append(roundForFingerprint(transaction.getQuantity(), QUANTITY_PRECISION)).append("|");

        // Total amount - the most stable value from statements, rounded for consistency
        // Price per unit is intentionally excluded as it's derived and prone to AI variations
        fingerprintData.append(roundForFingerprint(transaction.getTotalAmount(), AMOUNT_PRECISION)).append("|");
        
        // Provider reference if available (helps distinguish similar transactions)
        if (transaction.getProviderReference() != null && !transaction.getProviderReference().isEmpty()) {
            fingerprintData.append("REF:").append(transaction.getProviderReference());
        }
        
        String fingerprintInput = fingerprintData.toString();
        String hash = generateSHA256(fingerprintInput);
        
        logger.info("Generated fingerprint: {} from input: {}", hash, fingerprintInput);
        
        return hash;
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
        
        // Quantity - rounded for consistency with imported fingerprints
        fingerprintData.append(roundForFingerprint(transaction.getQuantity(), QUANTITY_PRECISION)).append("|");

        // Total amount - rounded for consistency (price per unit excluded)
        fingerprintData.append(roundForFingerprint(transaction.getTotalAmount(), AMOUNT_PRECISION)).append("|");
        
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

    /**
     * Rounds a BigDecimal to a specified precision for fingerprint generation.
     * This helps prevent AI parsing variations (e.g., 531.259931 vs 531.259145)
     * from causing different fingerprints for the same transaction.
     *
     * @param value the BigDecimal value to round
     * @param precision the number of decimal places
     * @return the rounded value as a plain string
     */
    private String roundForFingerprint(BigDecimal value, int precision) {
        if (value == null) {
            return "0";
        }
        return value.setScale(precision, RoundingMode.HALF_UP)
                   .stripTrailingZeros()
                   .toPlainString();
    }
}