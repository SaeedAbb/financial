package com.basis.api.features.investment.dto;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.UUID;

public class PortfolioDTO {

    private Long id;
    private UUID uuid;
    private String name;
    private String description;
    private List<StockDTO> stocks;
    private BigDecimal totalInvestment;
    private BigDecimal totalCurrentValue;
    private BigDecimal totalGainLoss;
    private BigDecimal gainLossPercentage;
    private int activeStocksCount;
    private int soldStocksCount;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SSSXXX")
    private ZonedDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SSSXXX")
    private ZonedDateTime updatedAt;

    // Default constructor
    public PortfolioDTO() {}

    // Constructor for basic portfolio info
    public PortfolioDTO(Long id, UUID uuid, String name, String description,
                       ZonedDateTime createdAt, ZonedDateTime updatedAt) {
        this.id = id;
        this.uuid = uuid;
        this.name = name;
        this.description = description;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // Full constructor
    public PortfolioDTO(Long id, UUID uuid, String name, String description, List<StockDTO> stocks,
                       BigDecimal totalInvestment, BigDecimal totalCurrentValue, BigDecimal totalGainLoss,
                       BigDecimal gainLossPercentage, int activeStocksCount, int soldStocksCount,
                       ZonedDateTime createdAt, ZonedDateTime updatedAt) {
        this.id = id;
        this.uuid = uuid;
        this.name = name;
        this.description = description;
        this.stocks = stocks;
        this.totalInvestment = totalInvestment;
        this.totalCurrentValue = totalCurrentValue;
        this.totalGainLoss = totalGainLoss;
        this.gainLossPercentage = gainLossPercentage;
        this.activeStocksCount = activeStocksCount;
        this.soldStocksCount = soldStocksCount;
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

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public List<StockDTO> getStocks() {
        return stocks;
    }

    public void setStocks(List<StockDTO> stocks) {
        this.stocks = stocks;
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

    public int getActiveStocksCount() {
        return activeStocksCount;
    }

    public void setActiveStocksCount(int activeStocksCount) {
        this.activeStocksCount = activeStocksCount;
    }

    public int getSoldStocksCount() {
        return soldStocksCount;
    }

    public void setSoldStocksCount(int soldStocksCount) {
        this.soldStocksCount = soldStocksCount;
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