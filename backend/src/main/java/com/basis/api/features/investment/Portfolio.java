package com.basis.api.features.investment;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "portfolios", schema = "basis")
public class Portfolio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private UUID uuid = UUID.randomUUID();

    @Column(name = "user_id", nullable = false)
    @NotBlank(message = "User ID cannot be blank")
    private String userId;

    @Column(nullable = false, length = 100)
    @NotBlank(message = "Portfolio name is required")
    @Size(min = 1, max = 100, message = "Portfolio name must be between 1 and 100 characters")
    private String name;

    @Column(columnDefinition = "TEXT")
    @Size(max = 1000, message = "Description cannot exceed 1000 characters")
    private String description;

    @OneToMany(mappedBy = "portfolio", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<Stock> stocks = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private ZonedDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private ZonedDateTime updatedAt;

    @Version
    private Long version;

    // Default constructor
    public Portfolio() {}

    // Constructor for creating new portfolios
    public Portfolio(String userId, String name, String description) {
        this.userId = userId;
        this.name = name;
        this.description = description;
    }

    // Business methods
    public List<Stock> getActiveStocks() {
        return stocks.stream()
                .filter(stock -> stock.getStatus() == StockStatus.ACTIVE)
                .toList();
    }

    public List<Stock> getSoldStocks() {
        return stocks.stream()
                .filter(stock -> stock.getStatus() == StockStatus.SOLD)
                .toList();
    }

    public BigDecimal calculateTotalInvestment() {
        return stocks.stream()
                .filter(stock -> stock.getStatus() == StockStatus.ACTIVE)
                .map(stock -> stock.getPurchasePrice().multiply(stock.getQuantity()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public BigDecimal calculateTotalCurrentValue(BigDecimal currentMarketPrice) {
        return getActiveStocks().stream()
                .map(stock -> currentMarketPrice.multiply(stock.getQuantity()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public BigDecimal calculateTotalGainLoss() {
        return getSoldStocks().stream()
                .map(Stock::calculateGainLoss)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public void addStock(Stock stock) {
        stocks.add(stock);
        stock.setPortfolio(this);
    }

    public void removeStock(Stock stock) {
        stocks.remove(stock);
        stock.setPortfolio(null);
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

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
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

    public List<Stock> getStocks() {
        return stocks;
    }

    public void setStocks(List<Stock> stocks) {
        this.stocks = stocks;
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
        Portfolio portfolio = (Portfolio) o;
        return uuid != null && uuid.equals(portfolio.uuid);
    }

    @Override
    public int hashCode() {
        return uuid != null ? uuid.hashCode() : 0;
    }

    @Override
    public String toString() {
        return "Portfolio{" +
                "id=" + id +
                ", uuid=" + uuid +
                ", userId='" + userId + '\'' +
                ", name='" + name + '\'' +
                ", description='" + description + '\'' +
                '}';
    }
}