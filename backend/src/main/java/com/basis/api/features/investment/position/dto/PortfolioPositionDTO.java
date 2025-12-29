package com.basis.api.features.investment.position.dto;

import com.basis.api.features.investment.position.PositionStatus;
import com.basis.api.features.stock.master.dto.StockMasterDTO;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.UUID;

public class PortfolioPositionDTO {
    private Long id;
    private UUID uuid;
    private Long portfolioId;
    private StockMasterDTO stock;
    private BigDecimal quantity;
    private BigDecimal averageCostBasis;
    private BigDecimal totalCost;
    private BigDecimal currentValue;
    private BigDecimal unrealizedGainLoss;
    private BigDecimal unrealizedGainLossPercentage;
    private LocalDate firstPurchaseDate;
    private LocalDate lastTransactionDate;
    private PositionStatus status;
    private ZonedDateTime createdAt;
    private ZonedDateTime updatedAt;

    // Default constructor
    public PortfolioPositionDTO() {}

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

    public Long getPortfolioId() {
        return portfolioId;
    }

    public void setPortfolioId(Long portfolioId) {
        this.portfolioId = portfolioId;
    }

    public StockMasterDTO getStock() {
        return stock;
    }

    public void setStock(StockMasterDTO stock) {
        this.stock = stock;
    }

    public BigDecimal getQuantity() {
        return quantity;
    }

    public void setQuantity(BigDecimal quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getAverageCostBasis() {
        return averageCostBasis;
    }

    public void setAverageCostBasis(BigDecimal averageCostBasis) {
        this.averageCostBasis = averageCostBasis;
    }

    public BigDecimal getTotalCost() {
        return totalCost;
    }

    public void setTotalCost(BigDecimal totalCost) {
        this.totalCost = totalCost;
    }

    public BigDecimal getCurrentValue() {
        return currentValue;
    }

    public void setCurrentValue(BigDecimal currentValue) {
        this.currentValue = currentValue;
    }

    public BigDecimal getUnrealizedGainLoss() {
        return unrealizedGainLoss;
    }

    public void setUnrealizedGainLoss(BigDecimal unrealizedGainLoss) {
        this.unrealizedGainLoss = unrealizedGainLoss;
    }

    public BigDecimal getUnrealizedGainLossPercentage() {
        return unrealizedGainLossPercentage;
    }

    public void setUnrealizedGainLossPercentage(BigDecimal unrealizedGainLossPercentage) {
        this.unrealizedGainLossPercentage = unrealizedGainLossPercentage;
    }

    public LocalDate getFirstPurchaseDate() {
        return firstPurchaseDate;
    }

    public void setFirstPurchaseDate(LocalDate firstPurchaseDate) {
        this.firstPurchaseDate = firstPurchaseDate;
    }

    public LocalDate getLastTransactionDate() {
        return lastTransactionDate;
    }

    public void setLastTransactionDate(LocalDate lastTransactionDate) {
        this.lastTransactionDate = lastTransactionDate;
    }

    public PositionStatus getStatus() {
        return status;
    }

    public void setStatus(PositionStatus status) {
        this.status = status;
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