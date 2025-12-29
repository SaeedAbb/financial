package com.basis.api.features.investment.portfolio.dto;

import java.math.BigDecimal;

/**
 * DTO for user-wide portfolio summary statistics
 */
public class PortfolioSummaryDTO {
    private Integer totalPortfolios;
    private Integer totalActivePositions;
    private Integer totalClosedPositions;
    private Integer totalDistinctStocks;
    private BigDecimal totalInvestment;
    private BigDecimal totalCurrentValue;
    private BigDecimal totalGainLoss;
    private BigDecimal totalGainLossPercentage;

    // Default constructor
    public PortfolioSummaryDTO() {}

    // Getters and setters
    public Integer getTotalPortfolios() {
        return totalPortfolios;
    }

    public void setTotalPortfolios(Integer totalPortfolios) {
        this.totalPortfolios = totalPortfolios;
    }

    public Integer getTotalActivePositions() {
        return totalActivePositions;
    }

    public void setTotalActivePositions(Integer totalActivePositions) {
        this.totalActivePositions = totalActivePositions;
    }

    public Integer getTotalClosedPositions() {
        return totalClosedPositions;
    }

    public void setTotalClosedPositions(Integer totalClosedPositions) {
        this.totalClosedPositions = totalClosedPositions;
    }

    public Integer getTotalDistinctStocks() {
        return totalDistinctStocks;
    }

    public void setTotalDistinctStocks(Integer totalDistinctStocks) {
        this.totalDistinctStocks = totalDistinctStocks;
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
}