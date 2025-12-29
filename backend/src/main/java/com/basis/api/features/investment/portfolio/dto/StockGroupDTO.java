package com.basis.api.features.investment.portfolio.dto;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.List;

/**
 * DTO representing a group of portfolio positions for the same stock symbol
 */
public class StockGroupDTO {
    
    private String symbol;
    private String companyName;
    private BigDecimal currentPrice;
    private int totalQuantity;
    private int activeQuantity;
    private int soldQuantity;
    private BigDecimal weightedAveragePrice;
    private BigDecimal totalCost;
    private BigDecimal totalCurrentValue;
    private BigDecimal totalGainLoss;
    private BigDecimal gainLossPercentage;
    private ZonedDateTime firstPurchaseDate;
    private ZonedDateTime lastPurchaseDate;
    private List<StockGroupPositionDTO> positions;
    private int positionCount;

    // Constructors
    public StockGroupDTO() {}

    public StockGroupDTO(String symbol, String companyName) {
        this.symbol = symbol;
        this.companyName = companyName;
    }

    // Getters and Setters
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

    public BigDecimal getCurrentPrice() {
        return currentPrice;
    }

    public void setCurrentPrice(BigDecimal currentPrice) {
        this.currentPrice = currentPrice;
    }

    public int getTotalQuantity() {
        return totalQuantity;
    }

    public void setTotalQuantity(int totalQuantity) {
        this.totalQuantity = totalQuantity;
    }

    public int getActiveQuantity() {
        return activeQuantity;
    }

    public void setActiveQuantity(int activeQuantity) {
        this.activeQuantity = activeQuantity;
    }

    public int getSoldQuantity() {
        return soldQuantity;
    }

    public void setSoldQuantity(int soldQuantity) {
        this.soldQuantity = soldQuantity;
    }

    public BigDecimal getWeightedAveragePrice() {
        return weightedAveragePrice;
    }

    public void setWeightedAveragePrice(BigDecimal weightedAveragePrice) {
        this.weightedAveragePrice = weightedAveragePrice;
    }

    public BigDecimal getTotalCost() {
        return totalCost;
    }

    public void setTotalCost(BigDecimal totalCost) {
        this.totalCost = totalCost;
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

    public BigDecimal getGainLossPercentage() {
        return gainLossPercentage;
    }

    public void setGainLossPercentage(BigDecimal gainLossPercentage) {
        this.gainLossPercentage = gainLossPercentage;
    }

    public ZonedDateTime getFirstPurchaseDate() {
        return firstPurchaseDate;
    }

    public void setFirstPurchaseDate(ZonedDateTime firstPurchaseDate) {
        this.firstPurchaseDate = firstPurchaseDate;
    }

    public ZonedDateTime getLastPurchaseDate() {
        return lastPurchaseDate;
    }

    public void setLastPurchaseDate(ZonedDateTime lastPurchaseDate) {
        this.lastPurchaseDate = lastPurchaseDate;
    }

    public List<StockGroupPositionDTO> getPositions() {
        return positions;
    }

    public void setPositions(List<StockGroupPositionDTO> positions) {
        this.positions = positions;
    }

    public int getPositionCount() {
        return positionCount;
    }

    public void setPositionCount(int positionCount) {
        this.positionCount = positionCount;
    }

    // Utility methods
    public boolean hasActivePositions() {
        return activeQuantity > 0;
    }

    public boolean hasSoldPositions() {
        return soldQuantity > 0;
    }

    public boolean isGainer() {
        return totalGainLoss != null && totalGainLoss.compareTo(BigDecimal.ZERO) > 0;
    }

    public boolean isLoser() {
        return totalGainLoss != null && totalGainLoss.compareTo(BigDecimal.ZERO) < 0;
    }

    @Override
    public String toString() {
        return "StockGroupDTO{" +
                "symbol='" + symbol + '\'' +
                ", companyName='" + companyName + '\'' +
                ", totalQuantity=" + totalQuantity +
                ", activeQuantity=" + activeQuantity +
                ", totalCost=" + totalCost +
                ", totalCurrentValue=" + totalCurrentValue +
                ", totalGainLoss=" + totalGainLoss +
                ", positionCount=" + positionCount +
                '}';
    }
}