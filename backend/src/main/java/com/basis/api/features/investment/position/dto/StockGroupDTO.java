package com.basis.api.features.investment.position.dto;

import com.basis.api.features.stock.master.dto.StockMasterDTO;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.List;

/**
 * DTO representing a group of positions for the same stock symbol
 */
public class StockGroupDTO {
    private String symbol;
    private StockMasterDTO stock;
    private List<PortfolioPositionDTO> positions;
    
    // Aggregate quantities
    private BigDecimal totalQuantity;
    private BigDecimal totalAvailableQuantity;
    private BigDecimal totalSoldQuantity;
    
    // Aggregate financial metrics
    private BigDecimal totalInvestment;
    private BigDecimal totalCurrentValue;
    private BigDecimal totalGainLoss;
    private BigDecimal totalGainLossPercentage;
    
    // Position counts
    private Integer activePositionsCount;
    private Integer closedPositionsCount;
    private Integer totalPositionsCount;
    
    // Derived positions lists
    private List<PortfolioPositionDTO> activePositions;
    private List<PortfolioPositionDTO> closedPositions;
    
    // Date analytics
    private LocalDate earliestPurchaseDate;
    private LocalDate latestPurchaseDate;
    private LocalDate weightedAveragePurchaseDate;
    
    // Price analytics
    private BigDecimal averagePurchasePrice;
    private BigDecimal weightedAveragePurchasePrice;
    
    // Trading capability
    private Boolean canSell;
    
    // Timestamps
    private ZonedDateTime createdAt;
    private ZonedDateTime updatedAt;

    // Default constructor
    public StockGroupDTO() {}

    // Constructor with basic data
    public StockGroupDTO(String symbol, StockMasterDTO stock) {
        this.symbol = symbol;
        this.stock = stock;
    }

    // Getters and setters
    public String getSymbol() {
        return symbol;
    }

    public void setSymbol(String symbol) {
        this.symbol = symbol;
    }

    public StockMasterDTO getStock() {
        return stock;
    }

    public void setStock(StockMasterDTO stock) {
        this.stock = stock;
    }

    public List<PortfolioPositionDTO> getPositions() {
        return positions;
    }

    public void setPositions(List<PortfolioPositionDTO> positions) {
        this.positions = positions;
    }

    public BigDecimal getTotalQuantity() {
        return totalQuantity;
    }

    public void setTotalQuantity(BigDecimal totalQuantity) {
        this.totalQuantity = totalQuantity;
    }

    public BigDecimal getTotalAvailableQuantity() {
        return totalAvailableQuantity;
    }

    public void setTotalAvailableQuantity(BigDecimal totalAvailableQuantity) {
        this.totalAvailableQuantity = totalAvailableQuantity;
    }

    public BigDecimal getTotalSoldQuantity() {
        return totalSoldQuantity;
    }

    public void setTotalSoldQuantity(BigDecimal totalSoldQuantity) {
        this.totalSoldQuantity = totalSoldQuantity;
    }

    public BigDecimal getTotalInvestment() {
        return totalInvestment;
    }

    public void setTotalInvestment(BigDecimal totalInvestment) {
        this.totalInvestment = totalInvestment;
    }

    public BigDecimal getTotalCurrentValue() {
        return totalCurrentValue;
    }

    public void setTotalCurrentValue(BigDecimal totalCurrentValue) {
        this.totalCurrentValue = totalCurrentValue;
    }

    public BigDecimal getTotalGainLoss() {
        return totalGainLoss;
    }

    public void setTotalGainLoss(BigDecimal totalGainLoss) {
        this.totalGainLoss = totalGainLoss;
    }

    public BigDecimal getTotalGainLossPercentage() {
        return totalGainLossPercentage;
    }

    public void setTotalGainLossPercentage(BigDecimal totalGainLossPercentage) {
        this.totalGainLossPercentage = totalGainLossPercentage;
    }

    public Integer getActivePositionsCount() {
        return activePositionsCount;
    }

    public void setActivePositionsCount(Integer activePositionsCount) {
        this.activePositionsCount = activePositionsCount;
    }

    public Integer getClosedPositionsCount() {
        return closedPositionsCount;
    }

    public void setClosedPositionsCount(Integer closedPositionsCount) {
        this.closedPositionsCount = closedPositionsCount;
    }

    public Integer getTotalPositionsCount() {
        return totalPositionsCount;
    }

    public void setTotalPositionsCount(Integer totalPositionsCount) {
        this.totalPositionsCount = totalPositionsCount;
    }

    public List<PortfolioPositionDTO> getActivePositions() {
        return activePositions;
    }

    public void setActivePositions(List<PortfolioPositionDTO> activePositions) {
        this.activePositions = activePositions;
    }

    public List<PortfolioPositionDTO> getClosedPositions() {
        return closedPositions;
    }

    public void setClosedPositions(List<PortfolioPositionDTO> closedPositions) {
        this.closedPositions = closedPositions;
    }

    public LocalDate getEarliestPurchaseDate() {
        return earliestPurchaseDate;
    }

    public void setEarliestPurchaseDate(LocalDate earliestPurchaseDate) {
        this.earliestPurchaseDate = earliestPurchaseDate;
    }

    public LocalDate getLatestPurchaseDate() {
        return latestPurchaseDate;
    }

    public void setLatestPurchaseDate(LocalDate latestPurchaseDate) {
        this.latestPurchaseDate = latestPurchaseDate;
    }

    public LocalDate getWeightedAveragePurchaseDate() {
        return weightedAveragePurchaseDate;
    }

    public void setWeightedAveragePurchaseDate(LocalDate weightedAveragePurchaseDate) {
        this.weightedAveragePurchaseDate = weightedAveragePurchaseDate;
    }

    public BigDecimal getAveragePurchasePrice() {
        return averagePurchasePrice;
    }

    public void setAveragePurchasePrice(BigDecimal averagePurchasePrice) {
        this.averagePurchasePrice = averagePurchasePrice;
    }

    public BigDecimal getWeightedAveragePurchasePrice() {
        return weightedAveragePurchasePrice;
    }

    public void setWeightedAveragePurchasePrice(BigDecimal weightedAveragePurchasePrice) {
        this.weightedAveragePurchasePrice = weightedAveragePurchasePrice;
    }

    public Boolean getCanSell() {
        return canSell;
    }

    public void setCanSell(Boolean canSell) {
        this.canSell = canSell;
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