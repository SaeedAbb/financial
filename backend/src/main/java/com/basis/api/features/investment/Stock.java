package com.basis.api.features.investment;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "stocks", schema = "basis")
public class Stock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private UUID uuid = UUID.randomUUID();

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "portfolio_id", nullable = false)
    private Portfolio portfolio;

    @Column(nullable = false, length = 20)
    @NotBlank(message = "Stock symbol is required")
    @Size(min = 1, max = 20, message = "Stock symbol must be between 1 and 20 characters")
    @Pattern(regexp = "^[A-Z0-9.-]+$", message = "Stock symbol must contain only uppercase letters, numbers, dots, and hyphens")
    private String symbol;

    @Column(name = "company_name", nullable = false, length = 255)
    @NotBlank(message = "Company name is required")
    @Size(min = 1, max = 255, message = "Company name must be between 1 and 255 characters")
    private String companyName;

    @Column(nullable = false, precision = 15, scale = 6)
    @NotNull(message = "Quantity is required")
    @DecimalMin(value = "0.000001", message = "Quantity must be greater than 0")
    private BigDecimal quantity;

    @Column(name = "purchase_price", nullable = false, precision = 15, scale = 2)
    @NotNull(message = "Purchase price is required")
    @DecimalMin(value = "0.01", message = "Purchase price must be greater than 0")
    private BigDecimal purchasePrice;

    @Column(name = "purchase_date", nullable = false)
    @NotNull(message = "Purchase date is required")
    @PastOrPresent(message = "Purchase date cannot be in the future")
    private LocalDate purchaseDate;

    @Column(nullable = false, length = 10)
    @Enumerated(EnumType.STRING)
    @NotNull(message = "Stock status is required")
    private StockStatus status = StockStatus.ACTIVE;

    @Column(name = "sale_price", precision = 15, scale = 2)
    @DecimalMin(value = "0.01", message = "Sale price must be greater than 0")
    private BigDecimal salePrice;

    @Column(name = "sale_date")
    @PastOrPresent(message = "Sale date cannot be in the future")
    private LocalDate saleDate;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private ZonedDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private ZonedDateTime updatedAt;

    @Version
    private Long version;

    // Default constructor
    public Stock() {}

    // Constructor for buying stocks
    public Stock(Portfolio portfolio, String symbol, String companyName, BigDecimal quantity, 
                 BigDecimal purchasePrice, LocalDate purchaseDate) {
        this.portfolio = portfolio;
        this.symbol = symbol.toUpperCase();
        this.companyName = companyName;
        this.quantity = quantity;
        this.purchasePrice = purchasePrice;
        this.purchaseDate = purchaseDate;
        this.status = StockStatus.ACTIVE;
    }

    // Business methods
    public BigDecimal calculateInvestmentValue() {
        return quantity.multiply(purchasePrice);
    }

    public BigDecimal calculateCurrentValue(BigDecimal currentMarketPrice) {
        if (status == StockStatus.SOLD) {
            return BigDecimal.ZERO;
        }
        return quantity.multiply(currentMarketPrice);
    }

    public BigDecimal calculateGainLoss() {
        if (status != StockStatus.SOLD || salePrice == null) {
            return BigDecimal.ZERO;
        }
        BigDecimal saleValue = quantity.multiply(salePrice);
        BigDecimal purchaseValue = quantity.multiply(purchasePrice);
        return saleValue.subtract(purchaseValue);
    }

    public BigDecimal calculateGainLossPercentage() {
        if (status != StockStatus.SOLD || salePrice == null) {
            return BigDecimal.ZERO;
        }
        BigDecimal gainLoss = calculateGainLoss();
        BigDecimal investmentValue = calculateInvestmentValue();
        if (investmentValue.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return gainLoss.divide(investmentValue, 4, java.math.RoundingMode.HALF_UP)
                .multiply(new BigDecimal("100"));
    }

    public void sellStock(BigDecimal salePrice, LocalDate saleDate) {
        if (this.status == StockStatus.SOLD) {
            throw new IllegalStateException("Stock is already sold");
        }
        if (saleDate.isBefore(this.purchaseDate)) {
            throw new IllegalArgumentException("Sale date cannot be before purchase date");
        }
        this.salePrice = salePrice;
        this.saleDate = saleDate;
        this.status = StockStatus.SOLD;
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

    public Portfolio getPortfolio() {
        return portfolio;
    }

    public void setPortfolio(Portfolio portfolio) {
        this.portfolio = portfolio;
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

    public BigDecimal getQuantity() {
        return quantity;
    }

    public void setQuantity(BigDecimal quantity) {
        this.quantity = quantity;
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

    public Long getVersion() {
        return version;
    }

    public void setVersion(Long version) {
        this.version = version;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Stock stock = (Stock) o;
        return uuid != null && uuid.equals(stock.uuid);
    }

    @Override
    public int hashCode() {
        return uuid != null ? uuid.hashCode() : 0;
    }

    @Override
    public String toString() {
        return "Stock{" +
                "id=" + id +
                ", uuid=" + uuid +
                ", symbol='" + symbol + '\'' +
                ", companyName='" + companyName + '\'' +
                ", quantity=" + quantity +
                ", purchasePrice=" + purchasePrice +
                ", purchaseDate=" + purchaseDate +
                ", status=" + status +
                '}';
    }
}