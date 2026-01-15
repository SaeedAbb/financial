package com.basis.api.features.transaction;

import com.basis.api.features.statement.providers.StatementProvider;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "transactions", schema = "basis")
@Getter
@Setter
@NoArgsConstructor
@ToString(exclude = {"notes", "originalDescription"})
@EqualsAndHashCode(of = "uuid")
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private UUID uuid = UUID.randomUUID();

    @Column(name = "user_id", nullable = false)
    @NotBlank(message = "User ID is required")
    private String userId;

    @Column(name = "transaction_category", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    @NotNull(message = "Transaction category is required")
    private TransactionCategory transactionCategory;

    @Column(name = "transaction_type", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    @NotNull(message = "Transaction type is required")
    private TransactionType transactionType;

    @Column(name = "reference_id", nullable = false)
    @NotNull(message = "Reference ID is required")
    private Long referenceId;

    @Column(name = "reference_type", nullable = false, length = 50)
    @NotBlank(message = "Reference type is required")
    private String referenceType;

    @Column(name = "portfolio_id", nullable = false)
    @NotNull(message = "Portfolio ID is required")
    private Long portfolioId;

    @Column(nullable = false, length = 20)
    @NotBlank(message = "Symbol is required")
    private String symbol;

    @Column(nullable = false, precision = 15, scale = 6)
    @NotNull(message = "Quantity is required")
    @DecimalMin(value = "0.000001", message = "Quantity must be greater than 0")
    private BigDecimal quantity;

    @Column(name = "price_per_unit", nullable = false, precision = 15, scale = 2)
    @NotNull(message = "Price per unit is required")
    @DecimalMin(value = "0.01", message = "Price per unit must be greater than 0")
    private BigDecimal pricePerUnit;

    @Column(name = "total_amount", nullable = false, precision = 15, scale = 2)
    @NotNull(message = "Total amount is required")
    private BigDecimal totalAmount;

    @Column(precision = 15, scale = 2)
    @DecimalMin(value = "0", message = "Fees cannot be negative")
    private BigDecimal fees = BigDecimal.ZERO;

    @Column(name = "transaction_date", nullable = false)
    @NotNull(message = "Transaction date is required")
    @PastOrPresent(message = "Transaction date cannot be in the future")
    private LocalDate transactionDate;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "import_provider", length = 50)
    @Enumerated(EnumType.STRING)
    private StatementProvider importProvider;

    @Column(name = "import_batch_id")
    private UUID importBatchId;

    @Column(name = "original_description", columnDefinition = "TEXT")
    private String originalDescription;

    @Column(name = "provider_reference")
    private String providerReference;

    @Column(name = "transaction_fingerprint", length = 64)
    private String transactionFingerprint;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private ZonedDateTime createdAt;

    @Version
    private Long version;

    // Static factory for stock transactions
    public static Transaction createStockTransaction(String userId, TransactionType type, Long positionId,
            Long portfolioId, String symbol, BigDecimal quantity, BigDecimal pricePerUnit, LocalDate transactionDate, String notes) {
        Transaction transaction = new Transaction();
        transaction.userId = userId;
        transaction.transactionCategory = TransactionCategory.STOCK;
        transaction.transactionType = type;
        transaction.referenceId = positionId;
        transaction.referenceType = "PORTFOLIO_POSITION";
        transaction.portfolioId = portfolioId;
        transaction.symbol = symbol;
        transaction.quantity = quantity;
        transaction.pricePerUnit = pricePerUnit;
        transaction.totalAmount = quantity.multiply(pricePerUnit);
        transaction.transactionDate = transactionDate;
        transaction.notes = notes;
        return transaction;
    }

    // Business methods
    public BigDecimal calculateNetAmount() {
        if (transactionType == TransactionType.BUY) {
            return totalAmount.add(fees);
        } else if (transactionType == TransactionType.SELL) {
            return totalAmount.subtract(fees);
        }
        return totalAmount;
    }

    public boolean isBuyTransaction() {
        return transactionType == TransactionType.BUY;
    }

    public boolean isSellTransaction() {
        return transactionType == TransactionType.SELL;
    }

    public BigDecimal calculateGainLoss(BigDecimal costBasis) {
        if (transactionType != TransactionType.SELL || costBasis == null) {
            return BigDecimal.ZERO;
        }
        BigDecimal saleCost = quantity.multiply(costBasis);
        BigDecimal saleProceeds = totalAmount;
        return saleProceeds.subtract(saleCost).subtract(fees);
    }
}
