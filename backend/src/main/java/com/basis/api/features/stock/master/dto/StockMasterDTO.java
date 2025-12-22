package com.basis.api.features.stock.master.dto;

import com.basis.api.features.stock.master.MarketCapCategory;

import java.time.ZonedDateTime;

public class StockMasterDTO {
    private Long id;
    private String symbol;
    private String companyName;
    private String exchange;
    private String sector;
    private String industry;
    private MarketCapCategory marketCapCategory;
    private String isin;
    private ZonedDateTime createdAt;
    private ZonedDateTime updatedAt;

    // Default constructor
    public StockMasterDTO() {}

    // Constructor with basic fields
    public StockMasterDTO(Long id, String symbol, String companyName, String exchange, String sector) {
        this.id = id;
        this.symbol = symbol;
        this.companyName = companyName;
        this.exchange = exchange;
        this.sector = sector;
    }

    // Getters and setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public String getExchange() {
        return exchange;
    }

    public void setExchange(String exchange) {
        this.exchange = exchange;
    }

    public String getSector() {
        return sector;
    }

    public void setSector(String sector) {
        this.sector = sector;
    }

    public String getIndustry() {
        return industry;
    }

    public void setIndustry(String industry) {
        this.industry = industry;
    }

    public MarketCapCategory getMarketCapCategory() {
        return marketCapCategory;
    }

    public void setMarketCapCategory(MarketCapCategory marketCapCategory) {
        this.marketCapCategory = marketCapCategory;
    }

    public String getIsin() {
        return isin;
    }

    public void setIsin(String isin) {
        this.isin = isin;
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