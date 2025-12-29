package com.basis.api.features.transaction;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    Optional<Transaction> findByUuid(UUID uuid);

    List<Transaction> findByUserId(String userId);

    Page<Transaction> findByUserId(String userId, Pageable pageable);

    List<Transaction> findByUserIdAndTransactionCategory(String userId, TransactionCategory category);

    List<Transaction> findByUserIdAndTransactionType(String userId, TransactionType type);

    List<Transaction> findByReferenceIdAndReferenceType(Long referenceId, String referenceType);

    @Query("SELECT t FROM Transaction t WHERE t.userId = :userId AND t.transactionDate BETWEEN :startDate AND :endDate ORDER BY t.transactionDate DESC")
    List<Transaction> findByUserIdAndDateRange(@Param("userId") String userId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT t FROM Transaction t WHERE t.userId = :userId AND t.symbol = :symbol ORDER BY t.transactionDate DESC")
    List<Transaction> findByUserIdAndSymbol(@Param("userId") String userId, @Param("symbol") String symbol);

    @Query("SELECT t FROM Transaction t WHERE t.referenceId = :referenceId AND t.referenceType = :referenceType AND t.transactionType = :type ORDER BY t.transactionDate DESC")
    List<Transaction> findByReferenceAndType(@Param("referenceId") Long referenceId, @Param("referenceType") String referenceType, @Param("type") TransactionType type);

    @Query("SELECT SUM(t.totalAmount) FROM Transaction t WHERE t.userId = :userId AND t.transactionType = :type")
    BigDecimal calculateTotalAmountByUserAndType(@Param("userId") String userId, @Param("type") TransactionType type);

    @Query("SELECT SUM(t.fees) FROM Transaction t WHERE t.userId = :userId AND t.transactionDate BETWEEN :startDate AND :endDate")
    BigDecimal calculateTotalFeesByUserAndDateRange(@Param("userId") String userId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT COUNT(t) FROM Transaction t WHERE t.userId = :userId AND t.transactionCategory = :category")
    long countByUserIdAndCategory(@Param("userId") String userId, @Param("category") TransactionCategory category);

    @Query("SELECT DISTINCT t.symbol FROM Transaction t WHERE t.userId = :userId AND t.transactionCategory = :category ORDER BY t.symbol")
    List<String> findDistinctSymbolsByUserIdAndCategory(@Param("userId") String userId, @Param("category") TransactionCategory category);

    @Query("SELECT t.transactionDate, SUM(CASE WHEN t.transactionType = 'BUY' THEN t.totalAmount ELSE 0 END) as buyAmount, " +
           "SUM(CASE WHEN t.transactionType = 'SELL' THEN t.totalAmount ELSE 0 END) as sellAmount " +
           "FROM Transaction t WHERE t.userId = :userId AND t.transactionCategory = :category " +
           "GROUP BY t.transactionDate ORDER BY t.transactionDate")
    List<Object[]> getTransactionSummaryByUserAndCategory(@Param("userId") String userId, @Param("category") TransactionCategory category);
}