package com.basis.api.features.saving.dto;

import com.basis.api.features.saving.SavingType;
import com.fasterxml.jackson.annotation.JsonFormat;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.UUID;

public class SavingDTO {
    
    private Long id;
    private UUID uuid;
    private BigDecimal amount;
    private SavingType savingType;
    
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate savingDate;
    
    private String comments;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SSSXXX")
    private ZonedDateTime createdAt;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SSSXXX")
    private ZonedDateTime updatedAt;

    // Default constructor
    public SavingDTO() {}

    // Constructor
    public SavingDTO(Long id, UUID uuid, BigDecimal amount, SavingType savingType, 
                     LocalDate savingDate, String comments, ZonedDateTime createdAt, ZonedDateTime updatedAt) {
        this.id = id;
        this.uuid = uuid;
        this.amount = amount;
        this.savingType = savingType;
        this.savingDate = savingDate;
        this.comments = comments;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // Getters and setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public UUID getUuid() {
        return uuid;
    }

    public void setUuid(UUID uuid) {
        this.uuid = uuid;
    }

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

    public ZonedDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(ZonedDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public ZonedDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(ZonedDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}