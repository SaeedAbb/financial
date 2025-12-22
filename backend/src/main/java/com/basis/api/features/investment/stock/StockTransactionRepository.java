package com.basis.api.features.investment.stock;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface StockTransactionRepository extends JpaRepository<StockTransaction, Long> {

    List<StockTransaction> findByStockIdOrderByTransactionDateDesc(Long stockId);

    List<StockTransaction> findByStockUuidOrderByTransactionDateDesc(UUID stockUuid);

    @Query("SELECT st FROM StockTransaction st " +
           "JOIN st.stock s " +
           "JOIN s.portfolio p " +
           "WHERE p.userId = :userId " +
           "ORDER BY st.transactionDate DESC")
    List<StockTransaction> findByUserIdOrderByTransactionDateDesc(@Param("userId") String userId);

    @Query("SELECT st FROM StockTransaction st " +
           "JOIN st.stock s " +
           "JOIN s.portfolio p " +
           "WHERE p.userId = :userId " +
           "AND st.type = :type " +
           "ORDER BY st.transactionDate DESC")
    List<StockTransaction> findByUserIdAndTypeOrderByTransactionDateDesc(
            @Param("userId") String userId, 
            @Param("type") TransactionType type);

    @Query("SELECT st FROM StockTransaction st " +
           "JOIN st.stock s " +
           "JOIN s.portfolio p " +
           "WHERE p.userId = :userId " +
           "AND st.transactionDate BETWEEN :startDate AND :endDate " +
           "ORDER BY st.transactionDate DESC")
    List<StockTransaction> findByUserIdAndTransactionDateBetweenOrderByTransactionDateDesc(
            @Param("userId") String userId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("SELECT COALESCE(SUM(st.totalValue), 0) FROM StockTransaction st " +
           "JOIN st.stock s " +
           "JOIN s.portfolio p " +
           "WHERE p.userId = :userId " +
           "AND st.type = :type")
    BigDecimal getTotalTransactionValueByUserIdAndType(
            @Param("userId") String userId, 
            @Param("type") TransactionType type);

    @Query("SELECT COALESCE(SUM(st.quantity), 0) FROM StockTransaction st " +
           "JOIN st.stock s " +
           "JOIN s.portfolio p " +
           "WHERE p.userId = :userId " +
           "AND st.type = :type " +
           "AND s.symbol = :symbol")
    BigDecimal getTotalQuantityByUserIdAndTypeAndSymbol(
            @Param("userId") String userId, 
            @Param("type") TransactionType type,
            @Param("symbol") String symbol);

    List<StockTransaction> findByStockIdAndTypeOrderByTransactionDateDesc(Long stockId, TransactionType type);

    @Query("SELECT COUNT(st) FROM StockTransaction st " +
           "JOIN st.stock s " +
           "JOIN s.portfolio p " +
           "WHERE p.userId = :userId")
    long countByUserId(@Param("userId") String userId);
}