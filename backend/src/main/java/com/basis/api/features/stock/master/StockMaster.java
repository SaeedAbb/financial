package com.basis.api.features.stock.master;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.ZonedDateTime;

@Entity
@Table(name = "stock_master", schema = "basis")
public class StockMaster {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 20)
    @NotBlank(message = "Stock symbol is required")
    @Size(min = 1, max = 20, message = "Stock symbol must be between 1 and 20 characters")
    @Pattern(regexp = "^[A-Z0-9.-]+$", message = "Stock symbol must contain only uppercase letters, numbers, dots, and hyphens")
    private String symbol;

    @Column(name = "company_name", nullable = false, length = 255)
    @NotBlank(message = "Company name is required")
    @Size(min = 1, max = 255, message = "Company name must be between 1 and 255 characters")
    private String companyName;

    @Column(length = 50)
    @Size(max = 50, message = "Exchange name must not exceed 50 characters")
    private String exchange;

    @Column(length = 100)
    @Size(max = 100, message = "Sector name must not exceed 100 characters")
    private String sector;

    @Column(length = 100)
    @Size(max = 100, message = "Industry name must not exceed 100 characters")
    private String industry;

    @Column(name = "market_cap_category", length = 20)
    @Enumerated(EnumType.STRING)
    private MarketCapCategory marketCapCategory;

    @Column(length = 20)
    @Size(max = 20, message = "ISIN must not exceed 20 characters")
    @Pattern(regexp = "^[A-Z]{2}[A-Z0-9]{9}[0-9]$", message = "Invalid ISIN format")
    private String isin;

    @Column(name = "current_price", precision = 15, scale = 2)
    @DecimalMin(value = "0", message = "Current price cannot be negative")
    private BigDecimal currentPrice = BigDecimal.ZERO;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private ZonedDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private ZonedDateTime updatedAt;

    // Default constructor
    public StockMaster() {}

    // Constructor
    public StockMaster(String symbol, String companyName) {
        this.symbol = symbol.toUpperCase();
        this.companyName = companyName;
    }

    // Constructor with all basic fields
    public StockMaster(String symbol, String companyName, String exchange, String sector) {
        this.symbol = symbol.toUpperCase();
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
        this.symbol = symbol != null ? symbol.toUpperCase() : null;
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

    public BigDecimal getCurrentPrice() {
        return currentPrice;
    }

    public void setCurrentPrice(BigDecimal currentPrice) {
        this.currentPrice = currentPrice;
    }

    /**
     * Get current price, returning zero if null
     */
    public BigDecimal getCurrentPriceSafe() {
        return currentPrice != null ? currentPrice : BigDecimal.ZERO;
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

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        StockMaster that = (StockMaster) o;
        return symbol != null && symbol.equals(that.symbol);
    }

    @Override
    public int hashCode() {
        return symbol != null ? symbol.hashCode() : 0;
    }

    @Override
    public String toString() {
        return "StockMaster{" +
                "id=" + id +
                ", symbol='" + symbol + '\'' +
                ", companyName='" + companyName + '\'' +
                ", exchange='" + exchange + '\'' +
                ", sector='" + sector + '\'' +
                '}';
    }
}