package com.basis.api.features.investment.portfolio.dto;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.UUID;

/**
 * DTO for portfolio statistics and performance metrics
 */
public class PortfolioStatisticsDTO {
    private Long portfolioId;
    private UUID portfolioUuid;
    private String portfolioName;
    private BigDecimal totalInvestment;
    private BigDecimal totalCurrentValue;
    private BigDecimal totalGainLoss;
    private BigDecimal gainLossPercentage;
    private Integer activePositionsCount;
    private Integer closedPositionsCount;
    private Integer totalPositionsCount;
    private Integer distinctStocksCount;
    private ZonedDateTime oldestPositionDate;
    private ZonedDateTime newestPositionDate;

    // Default constructor
    public PortfolioStatisticsDTO() {}

    // Constructor
    public PortfolioStatisticsDTO(Long portfolioId, UUID portfolioUuid, String portfolioName) {
        this.portfolioId = portfolioId;
        this.portfolioUuid = portfolioUuid;
        this.portfolioName = portfolioName;
    }

    // Getters and setters
    public Long getPortfolioId() {
        return portfolioId;
    }

    public void setPortfolioId(Long portfolioId) {
        this.portfolioId = portfolioId;
    }

    public UUID getPortfolioUuid() {
        return portfolioUuid;
    }

    public void setPortfolioUuid(UUID portfolioUuid) {
        this.portfolioUuid = portfolioUuid;
    }

    public String getPortfolioName() {
        return portfolioName;
    }

    public void setPortfolioName(String portfolioName) {
        this.portfolioName = portfolioName;
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

    public BigDecimal getGainLossPercentage() {
        return gainLossPercentage;
    }

    public void setGainLossPercentage(BigDecimal gainLossPercentage) {
        this.gainLossPercentage = gainLossPercentage;
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

    public Integer getDistinctStocksCount() {
        return distinctStocksCount;
    }

    public void setDistinctStocksCount(Integer distinctStocksCount) {
        this.distinctStocksCount = distinctStocksCount;
    }

    public ZonedDateTime getOldestPositionDate() {
        return oldestPositionDate;
    }

    public void setOldestPositionDate(ZonedDateTime oldestPositionDate) {
        this.oldestPositionDate = oldestPositionDate;
    }

    public ZonedDateTime getNewestPositionDate() {
        return newestPositionDate;
    }

    public void setNewestPositionDate(ZonedDateTime newestPositionDate) {
        this.newestPositionDate = newestPositionDate;
    }
}