package com.basis.api.features.investment.portfolio;

import com.basis.api.features.investment.portfolio.dto.PortfolioStatisticsDTO;
import com.basis.api.features.investment.portfolio.dto.PortfolioSummaryDTO;
import com.basis.api.features.investment.position.PortfolioPosition;
import com.basis.api.features.investment.position.PortfolioPositionRepository;
import com.basis.api.features.investment.position.PositionStatus;
import com.basis.api.shared.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for calculating portfolio statistics and performance metrics
 */
@Service
@Transactional(readOnly = true)
public class PortfolioStatisticsService {

    private final PortfolioRepository portfolioRepository;
    private final PortfolioPositionRepository positionRepository;

    public PortfolioStatisticsService(PortfolioRepository portfolioRepository,
                                      PortfolioPositionRepository positionRepository) {
        this.portfolioRepository = portfolioRepository;
        this.positionRepository = positionRepository;
    }

    /**
     * Get comprehensive statistics for a specific portfolio
     */
    public PortfolioStatisticsDTO getPortfolioStatistics(UUID portfolioUuid, String userId) {
        Portfolio portfolio = portfolioRepository.findByUuidAndUserId(portfolioUuid, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Portfolio not found with uuid: " + portfolioUuid));

        List<PortfolioPosition> positions = positionRepository.findByPortfolioIdAndPortfolioUserId(portfolio.getId(), userId);

        PortfolioStatisticsDTO statistics = new PortfolioStatisticsDTO(
                portfolio.getId(), portfolio.getUuid(), portfolio.getName());

        if (positions.isEmpty()) {
            // Initialize with zeros for empty portfolio
            statistics.setTotalInvestment(BigDecimal.ZERO);
            statistics.setTotalCurrentValue(BigDecimal.ZERO);
            statistics.setTotalGainLoss(BigDecimal.ZERO);
            statistics.setGainLossPercentage(BigDecimal.ZERO);
            statistics.setActivePositionsCount(0);
            statistics.setClosedPositionsCount(0);
            statistics.setTotalPositionsCount(0);
            statistics.setDistinctStocksCount(0);
            return statistics;
        }

        // Calculate totals
        BigDecimal totalInvestment = positions.stream()
                .map(PortfolioPosition::calculateTotalCost)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalCurrentValue = positions.stream()
                .map(pos -> pos.calculateCurrentValue(pos.getStock().getCurrentPriceSafe()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalGainLoss = totalCurrentValue.subtract(totalInvestment);

        BigDecimal gainLossPercentage = BigDecimal.ZERO;
        if (totalInvestment.compareTo(BigDecimal.ZERO) > 0) {
            gainLossPercentage = totalGainLoss.divide(totalInvestment, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
        }

        // Count positions by status
        long activePositions = positions.stream()
                .filter(pos -> pos.getStatus() == PositionStatus.ACTIVE)
                .count();

        long closedPositions = positions.stream()
                .filter(pos -> pos.getStatus() == PositionStatus.CLOSED)
                .count();

        // Count distinct stocks
        Set<String> distinctStocks = positions.stream()
                .map(pos -> pos.getStock().getSymbol())
                .collect(Collectors.toSet());

        // Find oldest and newest position dates
        ZonedDateTime oldestDate = positions.stream()
                .map(PortfolioPosition::getCreatedAt)
                .min(ZonedDateTime::compareTo)
                .orElse(null);

        ZonedDateTime newestDate = positions.stream()
                .map(PortfolioPosition::getCreatedAt)
                .max(ZonedDateTime::compareTo)
                .orElse(null);

        // Set statistics
        statistics.setTotalInvestment(totalInvestment);
        statistics.setTotalCurrentValue(totalCurrentValue);
        statistics.setTotalGainLoss(totalGainLoss);
        statistics.setGainLossPercentage(gainLossPercentage);
        statistics.setActivePositionsCount((int) activePositions);
        statistics.setClosedPositionsCount((int) closedPositions);
        statistics.setTotalPositionsCount(positions.size());
        statistics.setDistinctStocksCount(distinctStocks.size());
        statistics.setOldestPositionDate(oldestDate);
        statistics.setNewestPositionDate(newestDate);

        return statistics;
    }

    /**
     * Get summary statistics for all user portfolios
     */
    public PortfolioSummaryDTO getUserPortfoliosSummary(String userId) {
        List<Portfolio> userPortfolios = portfolioRepository.findByUserIdOrderByCreatedAtDesc(userId);
        
        PortfolioSummaryDTO summary = new PortfolioSummaryDTO();
        summary.setTotalPortfolios(userPortfolios.size());

        if (userPortfolios.isEmpty()) {
            // Initialize with zeros for user with no portfolios
            summary.setTotalActivePositions(0);
            summary.setTotalClosedPositions(0);
            summary.setTotalDistinctStocks(0);
            summary.setTotalInvestment(BigDecimal.ZERO);
            summary.setTotalCurrentValue(BigDecimal.ZERO);
            summary.setTotalGainLoss(BigDecimal.ZERO);
            summary.setTotalGainLossPercentage(BigDecimal.ZERO);
            return summary;
        }

        // Get all positions for all user portfolios
        List<Long> portfolioIds = userPortfolios.stream()
                .map(Portfolio::getId)
                .collect(Collectors.toList());

        List<PortfolioPosition> allPositions = positionRepository.findByPortfolioIdInAndPortfolioUserId(portfolioIds, userId);

        if (allPositions.isEmpty()) {
            // Initialize with zeros if user has portfolios but no positions
            summary.setTotalActivePositions(0);
            summary.setTotalClosedPositions(0);
            summary.setTotalDistinctStocks(0);
            summary.setTotalInvestment(BigDecimal.ZERO);
            summary.setTotalCurrentValue(BigDecimal.ZERO);
            summary.setTotalGainLoss(BigDecimal.ZERO);
            summary.setTotalGainLossPercentage(BigDecimal.ZERO);
            return summary;
        }

        // Calculate aggregate totals
        BigDecimal totalInvestment = allPositions.stream()
                .map(PortfolioPosition::calculateTotalCost)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalCurrentValue = allPositions.stream()
                .map(pos -> pos.calculateCurrentValue(pos.getStock().getCurrentPriceSafe()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalGainLoss = totalCurrentValue.subtract(totalInvestment);

        BigDecimal totalGainLossPercentage = BigDecimal.ZERO;
        if (totalInvestment.compareTo(BigDecimal.ZERO) > 0) {
            totalGainLossPercentage = totalGainLoss.divide(totalInvestment, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
        }

        // Count positions by status
        int activePositions = (int) allPositions.stream()
                .filter(pos -> pos.getStatus() == PositionStatus.ACTIVE)
                .count();

        int closedPositions = (int) allPositions.stream()
                .filter(pos -> pos.getStatus() == PositionStatus.CLOSED)
                .count();

        // Count distinct stocks across all portfolios
        int distinctStocks = allPositions.stream()
                .map(pos -> pos.getStock().getSymbol())
                .collect(Collectors.toSet())
                .size();

        // Set summary statistics
        summary.setTotalActivePositions(activePositions);
        summary.setTotalClosedPositions(closedPositions);
        summary.setTotalDistinctStocks(distinctStocks);
        summary.setTotalInvestment(totalInvestment);
        summary.setTotalCurrentValue(totalCurrentValue);
        summary.setTotalGainLoss(totalGainLoss);
        summary.setTotalGainLossPercentage(totalGainLossPercentage);

        return summary;
    }
}