package com.basis.api.features.statement;

import com.basis.api.features.statement.providers.StatementProvider;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.hibernate.annotations.CreationTimestamp;

import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "import_batches", schema = "basis")
@Getter
@Setter
@NoArgsConstructor
@ToString(exclude = {"errorMessage"})
@EqualsAndHashCode(of = "batchId")
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

    @Column(name = "duplicate_count")
    private Integer duplicateCount = 0;

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

    public void incrementDuplicate() {
        this.duplicateCount++;
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
}
