package com.basis.api.features.statement.dto;

import com.basis.api.features.statement.ImportStatus;

import java.time.ZonedDateTime;
import java.util.List;
import java.util.UUID;

public class ImportResultDTO {
    
    private UUID batchId;
    private ImportStatus status;
    private Integer totalTransactions;
    private Integer successCount;
    private Integer failureCount;
    private Integer duplicateCount;
    private ZonedDateTime createdAt;
    private ZonedDateTime completedAt;
    private List<TransactionImportResultDTO> results;
    private String errorMessage;
    
    // Default constructor
    public ImportResultDTO() {}
    
    // Success constructor
    public static ImportResultDTO success(UUID batchId, int totalTransactions, int successCount, 
                                        List<TransactionImportResultDTO> results) {
        ImportResultDTO dto = new ImportResultDTO();
        dto.batchId = batchId;
        dto.status = successCount == totalTransactions ? ImportStatus.COMPLETED : ImportStatus.PARTIALLY_COMPLETED;
        dto.totalTransactions = totalTransactions;
        dto.successCount = successCount;
        dto.failureCount = totalTransactions - successCount;
        dto.duplicateCount = 0; // Will be set by the service
        dto.results = results;
        dto.createdAt = ZonedDateTime.now();
        dto.completedAt = ZonedDateTime.now();
        return dto;
    }
    
    // Success constructor with duplicate count
    public static ImportResultDTO success(UUID batchId, int totalTransactions, int successCount, 
                                        int duplicateCount, List<TransactionImportResultDTO> results) {
        ImportResultDTO dto = new ImportResultDTO();
        dto.batchId = batchId;
        dto.status = (successCount + duplicateCount) == totalTransactions ? ImportStatus.COMPLETED : ImportStatus.PARTIALLY_COMPLETED;
        dto.totalTransactions = totalTransactions;
        dto.successCount = successCount;
        dto.failureCount = totalTransactions - successCount - duplicateCount;
        dto.duplicateCount = duplicateCount;
        dto.results = results;
        dto.createdAt = ZonedDateTime.now();
        dto.completedAt = ZonedDateTime.now();
        return dto;
    }
    
    // Failure constructor
    public static ImportResultDTO failure(UUID batchId, String errorMessage) {
        ImportResultDTO dto = new ImportResultDTO();
        dto.batchId = batchId;
        dto.status = ImportStatus.FAILED;
        dto.errorMessage = errorMessage;
        dto.createdAt = ZonedDateTime.now();
        dto.completedAt = ZonedDateTime.now();
        return dto;
    }
    
    // Inner class for individual transaction results
    public static class TransactionImportResultDTO {
        private Long transactionId;
        private UUID transactionUuid;
        private boolean success;
        private boolean duplicate;
        private String ticker;
        private String errorMessage;
        
        // Constructors
        public TransactionImportResultDTO() {}
        
        public TransactionImportResultDTO(Long transactionId, UUID transactionUuid, String ticker) {
            this.transactionId = transactionId;
            this.transactionUuid = transactionUuid;
            this.ticker = ticker;
            this.success = true;
        }
        
        public TransactionImportResultDTO(String errorMessage) {
            this.success = false;
            this.errorMessage = errorMessage;
        }
        
        // Constructor for duplicate transactions
        public static TransactionImportResultDTO duplicate(String ticker) {
            TransactionImportResultDTO dto = new TransactionImportResultDTO();
            dto.success = false;
            dto.duplicate = true;
            dto.ticker = ticker;
            dto.errorMessage = "Transaction already exists (duplicate)";
            return dto;
        }
        
        // Getters and Setters
        public Long getTransactionId() {
            return transactionId;
        }
        
        public void setTransactionId(Long transactionId) {
            this.transactionId = transactionId;
        }
        
        public UUID getTransactionUuid() {
            return transactionUuid;
        }
        
        public void setTransactionUuid(UUID transactionUuid) {
            this.transactionUuid = transactionUuid;
        }
        
        public boolean isSuccess() {
            return success;
        }
        
        public void setSuccess(boolean success) {
            this.success = success;
        }
        
        public boolean isDuplicate() {
            return duplicate;
        }
        
        public void setDuplicate(boolean duplicate) {
            this.duplicate = duplicate;
        }
        
        public String getTicker() {
            return ticker;
        }
        
        public void setTicker(String ticker) {
            this.ticker = ticker;
        }
        
        public String getErrorMessage() {
            return errorMessage;
        }
        
        public void setErrorMessage(String errorMessage) {
            this.errorMessage = errorMessage;
        }
    }
    
    // Getters and Setters
    public UUID getBatchId() {
        return batchId;
    }
    
    public void setBatchId(UUID batchId) {
        this.batchId = batchId;
    }
    
    public ImportStatus getStatus() {
        return status;
    }
    
    public void setStatus(ImportStatus status) {
        this.status = status;
    }
    
    public Integer getTotalTransactions() {
        return totalTransactions;
    }
    
    public void setTotalTransactions(Integer totalTransactions) {
        this.totalTransactions = totalTransactions;
    }
    
    public Integer getSuccessCount() {
        return successCount;
    }
    
    public void setSuccessCount(Integer successCount) {
        this.successCount = successCount;
    }
    
    public Integer getFailureCount() {
        return failureCount;
    }
    
    public void setFailureCount(Integer failureCount) {
        this.failureCount = failureCount;
    }
    
    public Integer getDuplicateCount() {
        return duplicateCount;
    }
    
    public void setDuplicateCount(Integer duplicateCount) {
        this.duplicateCount = duplicateCount;
    }
    
    public ZonedDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(ZonedDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public ZonedDateTime getCompletedAt() {
        return completedAt;
    }
    
    public void setCompletedAt(ZonedDateTime completedAt) {
        this.completedAt = completedAt;
    }
    
    public List<TransactionImportResultDTO> getResults() {
        return results;
    }
    
    public void setResults(List<TransactionImportResultDTO> results) {
        this.results = results;
    }
    
    public String getErrorMessage() {
        return errorMessage;
    }
    
    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }
}