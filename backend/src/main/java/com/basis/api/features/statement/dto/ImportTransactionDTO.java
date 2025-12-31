package com.basis.api.features.statement.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;

public class ImportTransactionDTO {
    
    @NotNull(message = "Transaction date is required")
    @PastOrPresent(message = "Transaction date cannot be in the future")
    private LocalDate date;
    
    @NotBlank(message = "Transaction type is required")
    @Pattern(regexp = "BUY|SELL", message = "Type must be BUY or SELL")
    private String type;
    
    @NotBlank(message = "Description is required")
    private String description;
    
    @NotNull(message = "Quantity is required")
    @DecimalMin(value = "0.000001", message = "Quantity must be positive")
    private BigDecimal quantity;
    
    @NotNull(message = "Price per unit is required")
    @DecimalMin(value = "0.01", message = "Price per unit must be positive")
    private BigDecimal pricePerUnit;
    
    @NotNull(message = "Total amount is required")
    private BigDecimal totalAmount;
    
    @DecimalMin(value = "0", message = "Fees cannot be negative")
    private BigDecimal fees = BigDecimal.ZERO;
    
    @NotBlank(message = "Currency is required")
    private String currency;
    
    private String rawSymbol;  // Symbol as extracted from PDF
    
    @Pattern(regexp = "^[A-Z]{2}[A-Z0-9]{9}[0-9]$", message = "Invalid ISIN format")
    private String isin;  // International Securities Identification Number
    
    private String providerReference;  // Provider-specific reference
    
    // Default constructor
    public ImportTransactionDTO() {}
    
    // Getters and Setters
    public LocalDate getDate() {
        return date;
    }
    
    public void setDate(LocalDate date) {
        this.date = date;
    }
    
    public String getType() {
        return type;
    }
    
    public void setType(String type) {
        this.type = type;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public BigDecimal getQuantity() {
        return quantity;
    }
    
    public void setQuantity(BigDecimal quantity) {
        this.quantity = quantity;
    }
    
    public BigDecimal getPricePerUnit() {
        return pricePerUnit;
    }
    
    public void setPricePerUnit(BigDecimal pricePerUnit) {
        this.pricePerUnit = pricePerUnit;
    }
    
    public BigDecimal getTotalAmount() {
        return totalAmount;
    }
    
    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }
    
    public BigDecimal getFees() {
        return fees;
    }
    
    public void setFees(BigDecimal fees) {
        this.fees = fees;
    }
    
    public String getCurrency() {
        return currency;
    }
    
    public void setCurrency(String currency) {
        this.currency = currency;
    }
    
    public String getRawSymbol() {
        return rawSymbol;
    }
    
    public void setRawSymbol(String rawSymbol) {
        this.rawSymbol = rawSymbol;
    }
    
    public String getIsin() {
        return isin;
    }
    
    public void setIsin(String isin) {
        this.isin = isin;
    }
    
    public String getProviderReference() {
        return providerReference;
    }
    
    public void setProviderReference(String providerReference) {
        this.providerReference = providerReference;
    }
}