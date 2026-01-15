package com.basis.api.features.statement.exception;

public class ImportException extends RuntimeException {
    
    private final String provider;
    private final String batchId;
    
    public ImportException(String message) {
        super(message);
        this.provider = null;
        this.batchId = null;
    }
    
    public ImportException(String message, Throwable cause) {
        super(message, cause);
        this.provider = null;
        this.batchId = null;
    }
    
    public ImportException(String message, String provider, String batchId) {
        super(message);
        this.provider = provider;
        this.batchId = batchId;
    }
    
    public ImportException(String message, String provider, String batchId, Throwable cause) {
        super(message, cause);
        this.provider = provider;
        this.batchId = batchId;
    }
    
    public String getProvider() {
        return provider;
    }
    
    public String getBatchId() {
        return batchId;
    }
}