package com.basis.api.features.statement;

import com.basis.api.features.statement.providers.StatementProvider;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.ZonedDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ImportBatchRepository extends JpaRepository<ImportBatch, Long> {
    
    Optional<ImportBatch> findByBatchId(UUID batchId);
    
    List<ImportBatch> findByUserIdOrderByCreatedAtDesc(String userId);
    
    List<ImportBatch> findByUserIdAndProviderOrderByCreatedAtDesc(String userId, StatementProvider provider);
    
    List<ImportBatch> findByUserIdAndPortfolioIdOrderByCreatedAtDesc(String userId, Long portfolioId);
    
    @Query("SELECT ib FROM ImportBatch ib WHERE ib.userId = :userId " +
           "AND ib.createdAt BETWEEN :startDate AND :endDate " +
           "ORDER BY ib.createdAt DESC")
    List<ImportBatch> findByUserIdAndDateRange(String userId, ZonedDateTime startDate, ZonedDateTime endDate);
    
    @Query("SELECT COUNT(ib) FROM ImportBatch ib WHERE ib.userId = :userId " +
           "AND ib.status = com.basis.api.features.statement.ImportStatus.PROCESSING")
    long countProcessingBatchesByUserId(String userId);
    
    @Query("SELECT SUM(ib.successCount) FROM ImportBatch ib WHERE ib.userId = :userId " +
           "AND ib.portfolioId = :portfolioId")
    Long getTotalImportedTransactionsByPortfolio(String userId, Long portfolioId);
}