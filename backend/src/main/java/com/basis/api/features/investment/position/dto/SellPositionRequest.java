package com.basis.api.features.investment.position.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;

public class SellPositionRequest {

    // Note: positionId is set by the controller from the UUID path parameter
    private Long positionId;

    @NotNull(message = "Quantity to sell is required")
    @DecimalMin(value = "0.000001", message = "Quantity must be greater than 0")
    @Digits(integer = 10, fraction = 6, message = "Quantity format is invalid")
    private BigDecimal quantity;

    @NotNull(message = "Sale price per share is required")
    @DecimalMin(value = "0.01", message = "Sale price must be greater than 0")
    @Digits(integer = 10, fraction = 2, message = "Price format is invalid")
    private BigDecimal pricePerShare;

    @NotNull(message = "Transaction date is required")
    @PastOrPresent(message = "Transaction date cannot be in the future")
    private LocalDate transactionDate;

    @Size(max = 500, message = "Notes cannot exceed 500 characters")
    private String notes; // Optional - transaction notes

    // Default constructor
    public SellPositionRequest() {}

    // Constructor
    public SellPositionRequest(Long positionId, BigDecimal quantity, BigDecimal pricePerShare, LocalDate transactionDate) {
        this.positionId = positionId;
        this.quantity = quantity;
        this.pricePerShare = pricePerShare;
        this.transactionDate = transactionDate;
    }

    // Getters and setters
    public Long getPositionId() {
        return positionId;
    }

    public void setPositionId(Long positionId) {
        this.positionId = positionId;
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

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}