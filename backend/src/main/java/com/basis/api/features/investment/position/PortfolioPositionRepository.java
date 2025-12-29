package com.basis.api.features.investment.position;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PortfolioPositionRepository extends JpaRepository<PortfolioPosition, Long> {

    Optional<PortfolioPosition> findByUuid(UUID uuid);

    List<PortfolioPosition> findByPortfolioId(Long portfolioId);

    List<PortfolioPosition> findByPortfolioIdAndStatus(Long portfolioId, PositionStatus status);

    @Query("SELECT p FROM PortfolioPosition p WHERE p.portfolio.id = :portfolioId AND p.stock.id = :stockId")
    Optional<PortfolioPosition> findByPortfolioIdAndStockId(@Param("portfolioId") Long portfolioId, @Param("stockId") Long stockId);

    @Query("SELECT p FROM PortfolioPosition p WHERE p.portfolio.id = :portfolioId AND p.stock.symbol = :symbol")
    Optional<PortfolioPosition> findByPortfolioIdAndStockSymbol(@Param("portfolioId") Long portfolioId, @Param("symbol") String symbol);

    @Query("SELECT p FROM PortfolioPosition p WHERE p.portfolio.userId = :userId")
    List<PortfolioPosition> findByUserId(@Param("userId") String userId);

    @Query("SELECT p FROM PortfolioPosition p WHERE p.portfolio.userId = :userId AND p.status = :status")
    List<PortfolioPosition> findByUserIdAndStatus(@Param("userId") String userId, @Param("status") PositionStatus status);

    @Query("SELECT COUNT(p) FROM PortfolioPosition p WHERE p.portfolio.id = :portfolioId AND p.status = :status")
    long countByPortfolioIdAndStatus(@Param("portfolioId") Long portfolioId, @Param("status") PositionStatus status);

    @Query("SELECT SUM(p.quantity * p.averageCostBasis) FROM PortfolioPosition p WHERE p.portfolio.id = :portfolioId AND p.status = 'ACTIVE'")
    BigDecimal calculateTotalInvestmentValue(@Param("portfolioId") Long portfolioId);

    boolean existsByPortfolioIdAndStockId(Long portfolioId, Long stockId);

    /**
     * Find positions by portfolio ID and ensure portfolio belongs to user
     */
    @Query("SELECT p FROM PortfolioPosition p WHERE p.portfolio.id = :portfolioId AND p.portfolio.userId = :userId")
    List<PortfolioPosition> findByPortfolioIdAndPortfolioUserId(@Param("portfolioId") Long portfolioId, @Param("userId") String userId);

    /**
     * Find positions by portfolio IDs and ensure portfolios belong to user
     */
    @Query("SELECT p FROM PortfolioPosition p WHERE p.portfolio.id IN :portfolioIds AND p.portfolio.userId = :userId")
    List<PortfolioPosition> findByPortfolioIdInAndPortfolioUserId(@Param("portfolioIds") List<Long> portfolioIds, @Param("userId") String userId);

    /**
     * Find positions by portfolio UUID and ensure portfolio belongs to user
     */
    @Query("SELECT p FROM PortfolioPosition p WHERE p.portfolio.uuid = :portfolioUuid AND p.portfolio.userId = :userId")
    List<PortfolioPosition> findByPortfolioUuidAndUserId(@Param("portfolioUuid") UUID portfolioUuid, @Param("userId") String userId);

    /**
     * Find positions by portfolio ID, user ID and stock symbol
     */
    @Query("SELECT p FROM PortfolioPosition p WHERE p.portfolio.id = :portfolioId AND p.portfolio.userId = :userId AND p.stock.symbol = :symbol")
    List<PortfolioPosition> findByPortfolioIdAndPortfolioUserIdAndStockSymbol(@Param("portfolioId") Long portfolioId, @Param("userId") String userId, @Param("symbol") String symbol);
}