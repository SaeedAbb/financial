package com.basis.api.features.investment.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public class SellStockRequest {

    @NotNull(message = "Stock UUID is required")
    private UUID stockUuid;

    @NotNull(message = "Sale price is required")
    @DecimalMin(value = "0.01", message = "Sale price must be greater than 0")
    @Digits(integer = 13, fraction = 2, message = "Sale price must have at most 13 digits and 2 decimal places")
    private BigDecimal salePrice;

    @NotNull(message = "Sale date is required")
    @PastOrPresent(message = "Sale date cannot be in the future")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate saleDate;

    // Default constructor
    public SellStockRequest() {}

    // Constructor
    public SellStockRequest(UUID stockUuid, BigDecimal salePrice, LocalDate saleDate) {
        this.stockUuid = stockUuid;
        this.salePrice = salePrice;
        this.saleDate = saleDate;
    }

    // Getters and setters
    public UUID getStockUuid() {
        return stockUuid;
    }

    public void setStockUuid(UUID stockUuid) {
        this.stockUuid = stockUuid;
    }

    public BigDecimal getSalePrice() {
        return salePrice;
    }

    public void setSalePrice(BigDecimal salePrice) {
        this.salePrice = salePrice;
    }

    public LocalDate getSaleDate() {
        return saleDate;
    }

    public void setSaleDate(LocalDate saleDate) {
        this.saleDate = saleDate;
    }

    @Override
    public String toString() {
        return "SellStockRequest{" +
                "stockUuid=" + stockUuid +
                ", salePrice=" + salePrice +
                ", saleDate=" + saleDate +
                '}';
    }
}