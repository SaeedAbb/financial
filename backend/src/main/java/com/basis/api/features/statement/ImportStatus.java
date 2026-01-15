package com.basis.api.features.statement;

public enum ImportStatus {
    PENDING("Import pending"),
    PROCESSING("Processing transactions"),
    COMPLETED("Import completed successfully"),
    FAILED("Import failed"),
    PARTIALLY_COMPLETED("Some transactions imported successfully");
    
    private final String description;
    
    ImportStatus(String description) {
        this.description = description;
    }
    
    public String getDescription() {
        return description;
    }
    
    public boolean isTerminal() {
        return this == COMPLETED || this == FAILED || this == PARTIALLY_COMPLETED;
    }
}