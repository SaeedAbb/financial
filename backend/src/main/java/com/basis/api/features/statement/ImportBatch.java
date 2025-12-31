package com.basis.api.features.statement;

import com.basis.api.features.statement.providers.StatementProvider;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.hibernate.annotations.CreationTimestamp;

import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "import_batches", schema = "basis")
public class ImportBatch {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "batch_id", nullable = false, unique = true)
    private UUID batchId = UUID.randomUUID();
    
    @Column(name = "user_id", nullable = false)
    @NotBlank(message = "User ID is required")
    private String userId;
    
    @Column(name = "portfolio_id")
    private Long portfolioId;
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    @NotNull(message = "Provider is required")
    private StatementProvider provider;
    
    @Column(name = "file_name")
    private String fileName;
    
    @Column(name = "transaction_count")
    private Integer transactionCount = 0;
    
    @Column(name = "success_count")
    private Integer successCount = 0;
    
    @Column(name = "failure_count")
    private Integer failureCount = 0;
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private ImportStatus status = ImportStatus.PENDING;
    
    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private ZonedDateTime createdAt;
    
    @Column(name = "completed_at")
    private ZonedDateTime completedAt;
    
    @Version
    private Long version;
    
    // Default constructor
    public ImportBatch() {}
    
    // Constructor
    public ImportBatch(String userId, Long portfolioId, StatementProvider provider, String fileName) {
        this.userId = userId;
        this.portfolioId = portfolioId;
        this.provider = provider;
        this.fileName = fileName;
    }
    
    // Business methods
    public void startProcessing(int totalTransactions) {
        this.transactionCount = totalTransactions;
        this.status = ImportStatus.PROCESSING;
    }
    
    public void incrementSuccess() {
        this.successCount++;
    }
    
    public void incrementFailure() {
        this.failureCount++;
    }
    
    public void complete() {
        this.status = ImportStatus.COMPLETED;
        this.completedAt = ZonedDateTime.now();
    }
    
    public void fail(String errorMessage) {
        this.status = ImportStatus.FAILED;
        this.errorMessage = errorMessage;
        this.completedAt = ZonedDateTime.now();
    }
    
    public boolean isComplete() {
        return status == ImportStatus.COMPLETED || status == ImportStatus.FAILED;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public UUID getBatchId() {
        return batchId;
    }
    
    public void setBatchId(UUID batchId) {
        this.batchId = batchId;
    }
    
    public String getUserId() {
        return userId;
    }
    
    public void setUserId(String userId) {
        this.userId = userId;
    }
    
    public Long getPortfolioId() {
        return portfolioId;
    }
    
    public void setPortfolioId(Long portfolioId) {
        this.portfolioId = portfolioId;
    }
    
    public StatementProvider getProvider() {
        return provider;
    }
    
    public void setProvider(StatementProvider provider) {
        this.provider = provider;
    }
    
    public String getFileName() {
        return fileName;
    }
    
    public void setFileName(String fileName) {
        this.fileName = fileName;
    }
    
    public Integer getTransactionCount() {
        return transactionCount;
    }
    
    public void setTransactionCount(Integer transactionCount) {
        this.transactionCount = transactionCount;
    }
    
    public Integer getSuccessCount() {
        return successCount;
    }
    
    public void setSuccessCount(Integer successCount) {
        this.successCount = successCount;
    }
    
    public Integer getFailureCount() {
        return failureCount;
    }
    
    public void setFailureCount(Integer failureCount) {
        this.failureCount = failureCount;
    }
    
    public ImportStatus getStatus() {
        return status;
    }
    
    public void setStatus(ImportStatus status) {
        this.status = status;
    }
    
    public String getErrorMessage() {
        return errorMessage;
    }
    
    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }
    
    public ZonedDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(ZonedDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public ZonedDateTime getCompletedAt() {
        return completedAt;
    }
    
    public void setCompletedAt(ZonedDateTime completedAt) {
        this.completedAt = completedAt;
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
        ImportBatch that = (ImportBatch) o;
        return batchId != null && batchId.equals(that.batchId);
    }
    
    @Override
    public int hashCode() {
        return batchId != null ? batchId.hashCode() : 0;
    }
}