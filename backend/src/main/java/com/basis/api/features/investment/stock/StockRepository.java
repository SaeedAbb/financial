package com.basis.api.features.investment.stock;

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
public interface StockRepository extends JpaRepository<Stock, Long> {

    /**
     * Find all stocks for a specific portfolio
     */
    List<Stock> findByPortfolioIdOrderByPurchaseDateDesc(Long portfolioId);

    /**
     * Find all stocks for a specific portfolio with pagination
     */
    Page<Stock> findByPortfolioIdOrderByPurchaseDateDesc(Long portfolioId, Pageable pageable);

    /**
     * Find a specific stock by UUID
     */
    Optional<Stock> findByUuid(UUID uuid);

    /**
     * Find a specific stock by UUID and portfolio ID
     */
    Optional<Stock> findByUuidAndPortfolioId(UUID uuid, Long portfolioId);

    /**
     * Find stocks by portfolio and status
     */
    List<Stock> findByPortfolioIdAndStatusOrderByPurchaseDateDesc(Long portfolioId, StockStatus status);

    /**
     * Find stocks by symbol across all portfolios of a user
     */
    @Query("SELECT s FROM Stock s JOIN s.portfolio p WHERE p.userId = :userId AND s.symbol = :symbol ORDER BY s.purchaseDate DESC")
    List<Stock> findByUserIdAndSymbolOrderByPurchaseDateDesc(@Param("userId") String userId, @Param("symbol") String symbol);

    /**
     * Find stocks by user within date range
     */
    @Query("SELECT s FROM Stock s JOIN s.portfolio p WHERE p.userId = :userId AND s.purchaseDate BETWEEN :startDate AND :endDate ORDER BY s.purchaseDate DESC")
    List<Stock> findByUserIdAndPurchaseDateBetweenOrderByPurchaseDateDesc(
            @Param("userId") String userId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    /**
     * Get total investment value for active stocks in a portfolio
     */
    @Query("SELECT COALESCE(SUM(s.quantity * s.purchasePrice), 0) FROM Stock s WHERE s.portfolio.id = :portfolioId AND s.status = 'ACTIVE'")
    BigDecimal getTotalInvestmentValueByPortfolioId(@Param("portfolioId") Long portfolioId);

    /**
     * Get total gain/loss for sold stocks in a portfolio
     */
    @Query("SELECT COALESCE(SUM((s.salePrice - s.purchasePrice) * s.quantity), 0) FROM Stock s WHERE s.portfolio.id = :portfolioId AND s.status = 'SOLD'")
    BigDecimal getTotalGainLossByPortfolioId(@Param("portfolioId") Long portfolioId);

    /**
     * Get total investment value for all active stocks of a user
     */
    @Query("SELECT COALESCE(SUM(s.quantity * s.purchasePrice), 0) FROM Stock s JOIN s.portfolio p WHERE p.userId = :userId AND s.status = 'ACTIVE'")
    BigDecimal getTotalInvestmentValueByUserId(@Param("userId") String userId);

    /**
     * Get total gain/loss for all sold stocks of a user
     */
    @Query("SELECT COALESCE(SUM((s.salePrice - s.purchasePrice) * s.quantity), 0) FROM Stock s JOIN s.portfolio p WHERE p.userId = :userId AND s.status = 'SOLD'")
    BigDecimal getTotalGainLossByUserId(@Param("userId") String userId);

    /**
     * Count active stocks in a portfolio
     */
    long countByPortfolioIdAndStatus(Long portfolioId, StockStatus status);

    /**
     * Count total stocks of a user
     */
    @Query("SELECT COUNT(s) FROM Stock s JOIN s.portfolio p WHERE p.userId = :userId")
    long countByUserId(@Param("userId") String userId);

    /**
     * Get distinct stock symbols for a user
     */
    @Query("SELECT DISTINCT s.symbol FROM Stock s JOIN s.portfolio p WHERE p.userId = :userId ORDER BY s.symbol")
    List<String> getDistinctSymbolsByUserId(@Param("userId") String userId);

    /**
     * Find stocks by user and symbol with specific status
     */
    @Query("SELECT s FROM Stock s JOIN s.portfolio p WHERE p.userId = :userId AND s.symbol = :symbol AND s.status = :status ORDER BY s.purchaseDate DESC")
    List<Stock> findByUserIdAndSymbolAndStatusOrderByPurchaseDateDesc(
            @Param("userId") String userId, @Param("symbol") String symbol, @Param("status") StockStatus status);

    /**
     * Check if a stock exists for a portfolio
     */
    boolean existsByUuidAndPortfolioId(UUID uuid, Long portfolioId);

    /**
     * Delete a stock by UUID and portfolio ID (for security through portfolio ownership)
     */
    void deleteByUuidAndPortfolioId(UUID uuid, Long portfolioId);
}