package com.basis.api.features.statement.dto;

import com.basis.api.features.statement.providers.StatementProvider;
import java.util.List;
import java.util.Map;

public class ParsePdfResponseDTO {
    
    private boolean success;
    private StatementProvider provider;
    private List<ImportTransactionDTO> transactions;
    private String fileName;
    private Map<String, Object> metadata;
    private String message;
    
    // Default constructor
    public ParsePdfResponseDTO() {
        this.success = true;
    }
    
    // Constructor for success
    public ParsePdfResponseDTO(StatementProvider provider, List<ImportTransactionDTO> transactions) {
        this.success = true;
        this.provider = provider;
        this.transactions = transactions;
    }
    
    // Constructor for failure
    public ParsePdfResponseDTO(String message) {
        this.success = false;
        this.message = message;
    }
    
    // Getters and Setters
    public boolean isSuccess() {
        return success;
    }
    
    public void setSuccess(boolean success) {
        this.success = success;
    }
    
    public StatementProvider getProvider() {
        return provider;
    }
    
    public void setProvider(StatementProvider provider) {
        this.provider = provider;
    }
    
    public List<ImportTransactionDTO> getTransactions() {
        return transactions;
    }
    
    public void setTransactions(List<ImportTransactionDTO> transactions) {
        this.transactions = transactions;
    }
    
    public String getFileName() {
        return fileName;
    }
    
    public void setFileName(String fileName) {
        this.fileName = fileName;
    }
    
    public Map<String, Object> getMetadata() {
        return metadata;
    }
    
    public void setMetadata(Map<String, Object> metadata) {
        this.metadata = metadata;
    }
    
    public String getMessage() {
        return message;
    }
    
    public void setMessage(String message) {
        this.message = message;
    }
}