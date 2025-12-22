package com.basis.api.features.investment.position.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;

public class BuyPositionRequest {

    @NotBlank(message = "Stock symbol is required")
    @Pattern(regexp = "^[A-Z0-9.-]+$", message = "Invalid stock symbol format")
    private String stockSymbol;

    @NotNull(message = "Quantity is required")
    @DecimalMin(value = "0.000001", message = "Quantity must be greater than 0")
    @Digits(integer = 10, fraction = 6, message = "Quantity format is invalid")
    private BigDecimal quantity;

    @NotNull(message = "Price per share is required")
    @DecimalMin(value = "0.01", message = "Price per share must be greater than 0")
    @Digits(integer = 10, fraction = 2, message = "Price format is invalid")
    private BigDecimal pricePerShare;

    @NotNull(message = "Transaction date is required")
    @PastOrPresent(message = "Transaction date cannot be in the future")
    private LocalDate transactionDate;

    private String companyName; // Optional - used if stock doesn't exist in master

    // Default constructor
    public BuyPositionRequest() {}

    // Constructor
    public BuyPositionRequest(String stockSymbol, BigDecimal quantity, BigDecimal pricePerShare, LocalDate transactionDate) {
        this.stockSymbol = stockSymbol;
        this.quantity = quantity;
        this.pricePerShare = pricePerShare;
        this.transactionDate = transactionDate;
    }

    // Getters and setters
    public String getStockSymbol() {
        return stockSymbol;
    }

    public void setStockSymbol(String stockSymbol) {
        this.stockSymbol = stockSymbol;
    }

    public BigDecimal getQuantity() {
        return quantity;
    }

    public void setQuantity(BigDecimal quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getPricePerShare() {
        return pricePerShare;
    }

    public void setPricePerShare(BigDecimal pricePerShare) {
        this.pricePerShare = pricePerShare;
    }

    public LocalDate getTransactionDate() {
        return transactionDate;
    }

    public void setTransactionDate(LocalDate transactionDate) {
        this.transactionDate = transactionDate;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }
}