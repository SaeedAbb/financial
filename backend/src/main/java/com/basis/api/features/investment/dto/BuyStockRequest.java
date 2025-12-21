package com.basis.api.features.investment.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public class BuyStockRequest {

    @NotNull(message = "Portfolio UUID is required")
    private UUID portfolioUuid;

    @NotBlank(message = "Stock symbol is required")
    @Size(min = 1, max = 20, message = "Stock symbol must be between 1 and 20 characters")
    @Pattern(regexp = "^[A-Z0-9.-]+$", message = "Stock symbol must contain only uppercase letters, numbers, dots, and hyphens")
    private String symbol;

    @NotBlank(message = "Company name is required")
    @Size(min = 1, max = 255, message = "Company name must be between 1 and 255 characters")
    private String companyName;

    @NotNull(message = "Quantity is required")
    @DecimalMin(value = "0.000001", message = "Quantity must be greater than 0")
    @Digits(integer = 9, fraction = 6, message = "Quantity must have at most 9 digits and 6 decimal places")
    private BigDecimal quantity;

    @NotNull(message = "Purchase price is required")
    @DecimalMin(value = "0.01", message = "Purchase price must be greater than 0")
    @Digits(integer = 13, fraction = 2, message = "Purchase price must have at most 13 digits and 2 decimal places")
    private BigDecimal purchasePrice;

    @NotNull(message = "Purchase date is required")
    @PastOrPresent(message = "Purchase date cannot be in the future")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate purchaseDate;

    // Default constructor
    public BuyStockRequest() {}

    // Constructor
    public BuyStockRequest(UUID portfolioUuid, String symbol, String companyName, 
                          BigDecimal quantity, BigDecimal purchasePrice, LocalDate purchaseDate) {
        this.portfolioUuid = portfolioUuid;
        this.symbol = symbol;
        this.companyName = companyName;
        this.quantity = quantity;
        this.purchasePrice = purchasePrice;
        this.purchaseDate = purchaseDate;
    }

    // Getters and setters
    public UUID getPortfolioUuid() {
        return portfolioUuid;
    }

    public void setPortfolioUuid(UUID portfolioUuid) {
        this.portfolioUuid = portfolioUuid;
    }

    public String getSymbol() {
        return symbol;
    }

    public void setSymbol(String symbol) {
        this.symbol = symbol;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public BigDecimal getQuantity() {
        return quantity;
    }

    public void setQuantity(BigDecimal quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getPurchasePrice() {
        return purchasePrice;
    }

    public void setPurchasePrice(BigDecimal purchasePrice) {
        this.purchasePrice = purchasePrice;
    }

    public LocalDate getPurchaseDate() {
        return purchaseDate;
    }

    public void setPurchaseDate(LocalDate purchaseDate) {
        this.purchaseDate = purchaseDate;
    }

    @Override
    public String toString() {
        return "BuyStockRequest{" +
                "portfolioUuid=" + portfolioUuid +
                ", symbol='" + symbol + '\'' +
                ", companyName='" + companyName + '\'' +
                ", quantity=" + quantity +
                ", purchasePrice=" + purchasePrice +
                ", purchaseDate=" + purchaseDate +
                '}';
    }
}