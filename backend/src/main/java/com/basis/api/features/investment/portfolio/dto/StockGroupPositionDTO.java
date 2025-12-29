package com.basis.api.features.investment.portfolio.dto;

import com.basis.api.features.investment.position.PositionStatus;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.UUID;

/**
 * DTO representing a single position within a stock group
 */
public class StockGroupPositionDTO {
    
    private Long id;
    private UUID uuid;
    private int quantity;
    private BigDecimal purchasePrice;
    private BigDecimal totalCost;
    private BigDecimal currentValue;
    private BigDecimal gainLoss;
    private BigDecimal gainLossPercentage;
    private PositionStatus status;
    private ZonedDateTime purchaseDate;
    private ZonedDateTime lastUpdated;

    // Constructors
    public StockGroupPositionDTO() {}

    public StockGroupPositionDTO(Long id, UUID uuid, int quantity, BigDecimal purchasePrice, BigDecimal totalCost) {
        this.id = id;
        this.uuid = uuid;
        this.quantity = quantity;
        this.purchasePrice = purchasePrice;
        this.totalCost = totalCost;
    }

    // Getters and Setters
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

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getPurchasePrice() {
        return purchasePrice;
    }

    public void setPurchasePrice(BigDecimal purchasePrice) {
        this.purchasePrice = purchasePrice;
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

    public BigDecimal getGainLoss() {
        return gainLoss;
    }

    public void setGainLoss(BigDecimal gainLoss) {
        this.gainLoss = gainLoss;
    }

    public BigDecimal getGainLossPercentage() {
        return gainLossPercentage;
    }

    public void setGainLossPercentage(BigDecimal gainLossPercentage) {
        this.gainLossPercentage = gainLossPercentage;
    }

    public PositionStatus getStatus() {
        return status;
    }

    public void setStatus(PositionStatus status) {
        this.status = status;
    }

    public ZonedDateTime getPurchaseDate() {
        return purchaseDate;
    }

    public void setPurchaseDate(ZonedDateTime purchaseDate) {
        this.purchaseDate = purchaseDate;
    }

    public ZonedDateTime getLastUpdated() {
        return lastUpdated;
    }

    public void setLastUpdated(ZonedDateTime lastUpdated) {
        this.lastUpdated = lastUpdated;
    }

    // Utility methods
    public boolean isOpen() {
        return status == PositionStatus.ACTIVE;
    }

    public boolean isClosed() {
        return status == PositionStatus.CLOSED;
    }

    public boolean isGainer() {
        return gainLoss != null && gainLoss.compareTo(BigDecimal.ZERO) > 0;
    }

    public boolean isLoser() {
        return gainLoss != null && gainLoss.compareTo(BigDecimal.ZERO) < 0;
    }

    @Override
    public String toString() {
        return "StockGroupPositionDTO{" +
                "id=" + id +
                ", uuid=" + uuid +
                ", quantity=" + quantity +
                ", purchasePrice=" + purchasePrice +
                ", totalCost=" + totalCost +
                ", currentValue=" + currentValue +
                ", gainLoss=" + gainLoss +
                ", status=" + status +
                ", purchaseDate=" + purchaseDate +
                '}';
    }
}