package com.basis.api.features.investment.position;

import com.basis.api.features.investment.portfolio.Portfolio;
import com.basis.api.features.stock.master.StockMaster;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "portfolio_positions", schema = "basis")
public class PortfolioPosition {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private UUID uuid = UUID.randomUUID();

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "portfolio_id", nullable = false)
    private Portfolio portfolio;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "stock_id", nullable = false)
    private StockMaster stock;

    @Column(nullable = false, precision = 15, scale = 6)
    @NotNull(message = "Quantity is required")
    @DecimalMin(value = "0", message = "Quantity cannot be negative")
    private BigDecimal quantity = BigDecimal.ZERO;

    @Column(name = "average_cost_basis", nullable = false, precision = 15, scale = 2)
    @NotNull(message = "Average cost basis is required")
    @DecimalMin(value = "0", message = "Average cost basis cannot be negative")
    private BigDecimal averageCostBasis = BigDecimal.ZERO;

    @Column(name = "first_purchase_date")
    private LocalDate firstPurchaseDate;

    @Column(name = "last_transaction_date")
    private LocalDate lastTransactionDate;

    @Column(nullable = false, length = 10)
    @Enumerated(EnumType.STRING)
    @NotNull(message = "Position status is required")
    private PositionStatus status = PositionStatus.ACTIVE;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private ZonedDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private ZonedDateTime updatedAt;

    @Version
    private Long version;

    // Default constructor
    public PortfolioPosition() {}

    // Constructor for creating a new position
    public PortfolioPosition(Portfolio portfolio, StockMaster stock) {
        this.portfolio = portfolio;
        this.stock = stock;
        this.quantity = BigDecimal.ZERO;
        this.averageCostBasis = BigDecimal.ZERO;
        this.status = PositionStatus.ACTIVE;
    }

    // Business methods
    public void addShares(BigDecimal sharesToAdd, BigDecimal pricePerShare, LocalDate transactionDate) {
        if (sharesToAdd.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Shares to add must be positive");
        }
        if (pricePerShare.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Price per share must be positive");
        }

        // Calculate new average cost basis
        BigDecimal currentTotalCost = this.quantity.multiply(this.averageCostBasis);
        BigDecimal newSharesCost = sharesToAdd.multiply(pricePerShare);
        BigDecimal newTotalQuantity = this.quantity.add(sharesToAdd);
        
        if (newTotalQuantity.compareTo(BigDecimal.ZERO) > 0) {
            this.averageCostBasis = currentTotalCost.add(newSharesCost)
                    .divide(newTotalQuantity, 2, RoundingMode.HALF_UP);
        }
        
        this.quantity = newTotalQuantity;
        
        // Update dates
        if (this.firstPurchaseDate == null) {
            this.firstPurchaseDate = transactionDate;
        }
        this.lastTransactionDate = transactionDate;
        
        // Reactivate position if it was closed
        if (this.status == PositionStatus.CLOSED) {
            this.status = PositionStatus.ACTIVE;
        }
    }

    public void removeShares(BigDecimal sharesToRemove, LocalDate transactionDate) {
        if (sharesToRemove.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Shares to remove must be positive");
        }
        if (sharesToRemove.compareTo(this.quantity) > 0) {
            throw new IllegalArgumentException("Cannot remove more shares than available: " + this.quantity);
        }

        this.quantity = this.quantity.subtract(sharesToRemove);
        this.lastTransactionDate = transactionDate;
        
        // Close position if all shares are sold
        if (this.quantity.compareTo(BigDecimal.ZERO) == 0) {
            this.status = PositionStatus.CLOSED;
        }
    }

    public BigDecimal calculateTotalCost() {
        return this.quantity.multiply(this.averageCostBasis);
    }

    public BigDecimal calculateCurrentValue(BigDecimal currentPrice) {
        if (currentPrice == null || currentPrice.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        return this.quantity.multiply(currentPrice);
    }

    public BigDecimal calculateUnrealizedGainLoss(BigDecimal currentPrice) {
        if (currentPrice == null || this.quantity.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        BigDecimal currentValue = calculateCurrentValue(currentPrice);
        BigDecimal totalCost = calculateTotalCost();
        return currentValue.subtract(totalCost);
    }

    public BigDecimal calculateUnrealizedGainLossPercentage(BigDecimal currentPrice) {
        if (currentPrice == null || this.quantity.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        BigDecimal totalCost = calculateTotalCost();
        if (totalCost.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        BigDecimal gainLoss = calculateUnrealizedGainLoss(currentPrice);
        return gainLoss.divide(totalCost, 4, RoundingMode.HALF_UP)
                .multiply(new BigDecimal("100"));
    }

    public BigDecimal calculateRealizedGainLoss(BigDecimal quantity, BigDecimal salePrice) {
        if (quantity.compareTo(BigDecimal.ZERO) <= 0 || salePrice.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        BigDecimal saleCost = quantity.multiply(this.averageCostBasis);
        BigDecimal saleProceeds = quantity.multiply(salePrice);
        return saleProceeds.subtract(saleCost);
    }

    public boolean isActive() {
        return this.status == PositionStatus.ACTIVE && this.quantity.compareTo(BigDecimal.ZERO) > 0;
    }

    public boolean isClosed() {
        return this.status == PositionStatus.CLOSED || this.quantity.compareTo(BigDecimal.ZERO) == 0;
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

    public StockMaster getStock() {
        return stock;
    }

    public void setStock(StockMaster stock) {
        this.stock = stock;
    }

    public BigDecimal getQuantity() {
        return quantity;
    }

    public void setQuantity(BigDecimal quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getAverageCostBasis() {
        return averageCostBasis;
    }

    public void setAverageCostBasis(BigDecimal averageCostBasis) {
        this.averageCostBasis = averageCostBasis;
    }

    public LocalDate getFirstPurchaseDate() {
        return firstPurchaseDate;
    }

    public void setFirstPurchaseDate(LocalDate firstPurchaseDate) {
        this.firstPurchaseDate = firstPurchaseDate;
    }

    public LocalDate getLastTransactionDate() {
        return lastTransactionDate;
    }

    public void setLastTransactionDate(LocalDate lastTransactionDate) {
        this.lastTransactionDate = lastTransactionDate;
    }

    public PositionStatus getStatus() {
        return status;
    }

    public void setStatus(PositionStatus status) {
        this.status = status;
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
        PortfolioPosition that = (PortfolioPosition) o;
        return uuid != null && uuid.equals(that.uuid);
    }

    @Override
    public int hashCode() {
        return uuid != null ? uuid.hashCode() : 0;
    }

    @Override
    public String toString() {
        return "PortfolioPosition{" +
                "id=" + id +
                ", uuid=" + uuid +
                ", portfolio=" + portfolio.getId() +
                ", stock=" + stock.getSymbol() +
                ", quantity=" + quantity +
                ", averageCostBasis=" + averageCostBasis +
                ", status=" + status +
                '}';
    }
}