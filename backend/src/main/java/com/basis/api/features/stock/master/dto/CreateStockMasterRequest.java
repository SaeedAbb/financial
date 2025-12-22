package com.basis.api.features.stock.master.dto;

import jakarta.validation.constraints.*;

public class CreateStockMasterRequest {

    @NotBlank(message = "Stock symbol is required")
    @Size(min = 1, max = 20, message = "Stock symbol must be between 1 and 20 characters")
    @Pattern(regexp = "^[A-Z0-9.-]+$", message = "Stock symbol must contain only uppercase letters, numbers, dots, and hyphens")
    private String symbol;

    @NotBlank(message = "Company name is required")
    @Size(min = 1, max = 255, message = "Company name must be between 1 and 255 characters")
    private String companyName;

    @Size(max = 50, message = "Exchange name must not exceed 50 characters")
    private String exchange;

    @Size(max = 100, message = "Sector name must not exceed 100 characters")
    private String sector;

    @Size(max = 100, message = "Industry name must not exceed 100 characters")
    private String industry;

    private String marketCapCategory;

    @Size(max = 20, message = "ISIN must not exceed 20 characters")
    @Pattern(regexp = "^[A-Z]{2}[A-Z0-9]{9}[0-9]$", message = "Invalid ISIN format")
    private String isin;

    // Default constructor
    public CreateStockMasterRequest() {}

    // Constructor
    public CreateStockMasterRequest(String symbol, String companyName) {
        this.symbol = symbol;
        this.companyName = companyName;
    }

    // Getters and setters
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

    public String getMarketCapCategory() {
        return marketCapCategory;
    }

    public void setMarketCapCategory(String marketCapCategory) {
        this.marketCapCategory = marketCapCategory;
    }

    public String getIsin() {
        return isin;
    }

    public void setIsin(String isin) {
        this.isin = isin;
    }
}