package com.basis.api.features.investment.dto;

import com.basis.api.features.investment.StockStatus;
import com.fasterxml.jackson.annotation.JsonFormat;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.UUID;

public class StockDTO {

    private Long id;
    private UUID uuid;
    private Long portfolioId;
    private String portfolioName;
    private String symbol;
    private String companyName;
    private BigDecimal quantity;
    private BigDecimal availableQuantity;
    private BigDecimal soldQuantity;
    private BigDecimal purchasePrice;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate purchaseDate;

    private StockStatus status;
    private BigDecimal salePrice;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate saleDate;

    private BigDecimal investmentValue;
    private BigDecimal currentValue;
    private BigDecimal gainLoss;
    private BigDecimal gainLossPercentage;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SSSXXX")
    private ZonedDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SSSXXX")
    private ZonedDateTime updatedAt;

    // Default constructor
    public StockDTO() {}

    // Constructor for basic stock info
    public StockDTO(Long id, UUID uuid, Long portfolioId, String portfolioName, String symbol, 
                   String companyName, BigDecimal quantity, BigDecimal availableQuantity, 
                   BigDecimal soldQuantity, BigDecimal purchasePrice, LocalDate purchaseDate, 
                   StockStatus status, BigDecimal salePrice, LocalDate saleDate, 
                   ZonedDateTime createdAt, ZonedDateTime updatedAt) {
        this.id = id;
        this.uuid = uuid;
        this.portfolioId = portfolioId;
        this.portfolioName = portfolioName;
        this.symbol = symbol;
        this.companyName = companyName;
        this.quantity = quantity;
        this.availableQuantity = availableQuantity;
        this.soldQuantity = soldQuantity;
        this.purchasePrice = purchasePrice;
        this.purchaseDate = purchaseDate;
        this.status = status;
        this.salePrice = salePrice;
        this.saleDate = saleDate;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // Backward compatibility constructor
    public StockDTO(Long id, UUID uuid, Long portfolioId, String portfolioName, String symbol, 
                   String companyName, BigDecimal quantity, BigDecimal purchasePrice, 
                   LocalDate purchaseDate, StockStatus status, BigDecimal salePrice, 
                   LocalDate saleDate, ZonedDateTime createdAt, ZonedDateTime updatedAt) {
        this.id = id;
        this.uuid = uuid;
        this.portfolioId = portfolioId;
        this.portfolioName = portfolioName;
        this.symbol = symbol;
        this.companyName = companyName;
        this.quantity = quantity;
        this.purchasePrice = purchasePrice;
        this.purchaseDate = purchaseDate;
        this.status = status;
        this.salePrice = salePrice;
        this.saleDate = saleDate;
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

    public Long getPortfolioId() {
        return portfolioId;
    }

    public void setPortfolioId(Long portfolioId) {
        this.portfolioId = portfolioId;
    }

    public String getPortfolioName() {
        return portfolioName;
    }

    public void setPortfolioName(String portfolioName) {
        this.portfolioName = portfolioName;
    }

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

    public BigDecimal getQuantity() {
        return quantity;
    }

    public void setQuantity(BigDecimal quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getAvailableQuantity() {
        return availableQuantity;
    }

    public void setAvailableQuantity(BigDecimal availableQuantity) {
        this.availableQuantity = availableQuantity;
    }

    public BigDecimal getSoldQuantity() {
        return soldQuantity;
    }

    public void setSoldQuantity(BigDecimal soldQuantity) {
        this.soldQuantity = soldQuantity;
    }

    public BigDecimal getPurchasePrice() {
        return purchasePrice;
    }

    public void setPurchasePrice(BigDecimal purchasePrice) {
        this.purchasePrice = purchasePrice;
    }

    public LocalDate getPurchaseDate() {
        return purchaseDate;
    }

    public void setPurchaseDate(LocalDate purchaseDate) {
        this.purchaseDate = purchaseDate;
    }

    public StockStatus getStatus() {
        return status;
    }

    public void setStatus(StockStatus status) {
        this.status = status;
    }

    public BigDecimal getSalePrice() {
        return salePrice;
    }

    public void setSalePrice(BigDecimal salePrice) {
        this.salePrice = salePrice;
    }

    public LocalDate getSaleDate() {
        return saleDate;
    }

    public void setSaleDate(LocalDate saleDate) {
        this.saleDate = saleDate;
    }

    public BigDecimal getInvestmentValue() {
        return investmentValue;
    }

    public void setInvestmentValue(BigDecimal investmentValue) {
        this.investmentValue = investmentValue;
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