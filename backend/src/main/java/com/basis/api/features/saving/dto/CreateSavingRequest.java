package com.basis.api.features.saving.dto;

import com.basis.api.features.saving.SavingType;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;

public class CreateSavingRequest {

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
    @Digits(integer = 13, fraction = 2, message = "Amount must have at most 13 digits and 2 decimal places")
    private BigDecimal amount;

    @NotNull(message = "Saving type is required")
    private SavingType savingType;

    @NotNull(message = "Saving date is required")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate savingDate;

    @Size(max = 1000, message = "Comments cannot exceed 1000 characters")
    private String comments;

    // Default constructor
    public CreateSavingRequest() {}

    // Constructor
    public CreateSavingRequest(BigDecimal amount, SavingType savingType, LocalDate savingDate, String comments) {
        this.amount = amount;
        this.savingType = savingType;
        this.savingDate = savingDate;
        this.comments = comments;
    }

    // Getters and setters
    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public SavingType getSavingType() {
        return savingType;
    }

    public void setSavingType(SavingType savingType) {
        this.savingType = savingType;
    }

    public LocalDate getSavingDate() {
        return savingDate;
    }

    public void setSavingDate(LocalDate savingDate) {
        this.savingDate = savingDate;
    }

    public String getComments() {
        return comments;
    }

    public void setComments(String comments) {
        this.comments = comments;
    }

    @Override
    public String toString() {
        return "CreateSavingRequest{" +
                "amount=" + amount +
                ", savingType=" + savingType +
                ", savingDate=" + savingDate +
                ", comments='" + comments + '\'' +
                '}';
    }
}