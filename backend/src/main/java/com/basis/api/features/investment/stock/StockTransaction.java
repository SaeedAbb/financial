package com.basis.api.features.investment.stock;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "stock_transactions", schema = "basis")
public class StockTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private UUID uuid = UUID.randomUUID();

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "stock_id", nullable = false)
    private Stock stock;

    @Column(nullable = false, length = 10)
    @Enumerated(EnumType.STRING)
    @NotNull(message = "Transaction type is required")
    private TransactionType type;

    @Column(nullable = false, precision = 15, scale = 6)
    @NotNull(message = "Quantity is required")
    @DecimalMin(value = "0.000001", message = "Quantity must be greater than 0")
    private BigDecimal quantity;

    @Column(name = "price_per_share", nullable = false, precision = 15, scale = 2)
    @NotNull(message = "Price per share is required")
    @DecimalMin(value = "0.01", message = "Price per share must be greater than 0")
    private BigDecimal pricePerShare;

    @Column(name = "transaction_date", nullable = false)
    @NotNull(message = "Transaction date is required")
    @PastOrPresent(message = "Transaction date cannot be in the future")
    private LocalDate transactionDate;

    @Column(name = "total_value", nullable = false, precision = 15, scale = 2)
    @NotNull(message = "Total value is required")
    @DecimalMin(value = "0.01", message = "Total value must be greater than 0")
    private BigDecimal totalValue;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private ZonedDateTime createdAt;

    @Version
    private Long version;

    // Default constructor
    public StockTransaction() {}

    // Constructor for buy transaction
    public StockTransaction(Stock stock, BigDecimal quantity, BigDecimal pricePerShare, LocalDate transactionDate) {
        this.stock = stock;
        this.type = TransactionType.BUY;
        this.quantity = quantity;
        this.pricePerShare = pricePerShare;
        this.transactionDate = transactionDate;
        this.totalValue = quantity.multiply(pricePerShare);
    }

    // Constructor for sell transaction
    public static StockTransaction createSellTransaction(Stock stock, BigDecimal quantity, BigDecimal pricePerShare, LocalDate transactionDate) {
        StockTransaction transaction = new StockTransaction();
        transaction.stock = stock;
        transaction.type = TransactionType.SELL;
        transaction.quantity = quantity;
        transaction.pricePerShare = pricePerShare;
        transaction.transactionDate = transactionDate;
        transaction.totalValue = quantity.multiply(pricePerShare);
        return transaction;
    }

    // Business methods
    public boolean isBuyTransaction() {
        return type == TransactionType.BUY;
    }

    public boolean isSellTransaction() {
        return type == TransactionType.SELL;
    }

    public BigDecimal calculateGainLoss(BigDecimal purchasePrice) {
        if (type != TransactionType.SELL) {
            return BigDecimal.ZERO;
        }
        BigDecimal saleValue = quantity.multiply(pricePerShare);
        BigDecimal purchaseValue = quantity.multiply(purchasePrice);
        return saleValue.subtract(purchaseValue);
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

    public Stock getStock() {
        return stock;
    }

    public void setStock(Stock stock) {
        this.stock = stock;
    }

    public TransactionType getType() {
        return type;
    }

    public void setType(TransactionType type) {
        this.type = type;
    }

    public BigDecimal getQuantity() {
        return quantity;
    }

    public void setQuantity(BigDecimal quantity) {
        this.quantity = quantity;
        if (this.pricePerShare != null) {
            this.totalValue = this.quantity.multiply(this.pricePerShare);
        }
    }

    public BigDecimal getPricePerShare() {
        return pricePerShare;
    }

    public void setPricePerShare(BigDecimal pricePerShare) {
        this.pricePerShare = pricePerShare;
        if (this.quantity != null) {
            this.totalValue = this.quantity.multiply(this.pricePerShare);
        }
    }

    public LocalDate getTransactionDate() {
        return transactionDate;
    }

    public void setTransactionDate(LocalDate transactionDate) {
        this.transactionDate = transactionDate;
    }

    public BigDecimal getTotalValue() {
        return totalValue;
    }

    public void setTotalValue(BigDecimal totalValue) {
        this.totalValue = totalValue;
    }

    public ZonedDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(ZonedDateTime createdAt) {
        this.createdAt = createdAt;
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
        StockTransaction that = (StockTransaction) o;
        return uuid != null && uuid.equals(that.uuid);
    }

    @Override
    public int hashCode() {
        return uuid != null ? uuid.hashCode() : 0;
    }

    @Override
    public String toString() {
        return "StockTransaction{" +
                "id=" + id +
                ", uuid=" + uuid +
                ", type=" + type +
                ", quantity=" + quantity +
                ", pricePerShare=" + pricePerShare +
                ", transactionDate=" + transactionDate +
                ", totalValue=" + totalValue +
                '}';
    }
}