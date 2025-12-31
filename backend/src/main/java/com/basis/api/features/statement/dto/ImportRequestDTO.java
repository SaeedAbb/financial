package com.basis.api.features.statement.dto;

import com.basis.api.features.statement.providers.StatementProvider;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.Map;

public class ImportRequestDTO {
    
    @NotNull(message = "Provider is required")
    private StatementProvider provider;
    
    @NotNull(message = "Portfolio ID is required")
    private Long portfolioId;
    
    @NotNull(message = "Transactions cannot be null")
    @NotEmpty(message = "At least one transaction is required")
    @Valid
    private List<ImportTransactionDTO> transactions;
    
    private String fileName;
    
    private Map<String, Object> providerMetadata;
    
    // Default constructor
    public ImportRequestDTO() {}
    
    // Constructor
    public ImportRequestDTO(StatementProvider provider, Long portfolioId, List<ImportTransactionDTO> transactions) {
        this.provider = provider;
        this.portfolioId = portfolioId;
        this.transactions = transactions;
    }
    
    // Getters and Setters
    public StatementProvider getProvider() {
        return provider;
    }
    
    public void setProvider(StatementProvider provider) {
        this.provider = provider;
    }
    
    public Long getPortfolioId() {
        return portfolioId;
    }
    
    public void setPortfolioId(Long portfolioId) {
        this.portfolioId = portfolioId;
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
    
    public Map<String, Object> getProviderMetadata() {
        return providerMetadata;
    }
    
    public void setProviderMetadata(Map<String, Object> providerMetadata) {
        this.providerMetadata = providerMetadata;
    }
}