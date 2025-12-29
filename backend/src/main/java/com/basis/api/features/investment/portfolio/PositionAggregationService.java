package com.basis.api.features.investment.portfolio;

import com.basis.api.features.investment.portfolio.dto.StockGroupDTO;
import com.basis.api.features.investment.portfolio.dto.StockGroupPositionDTO;
import com.basis.api.features.investment.position.PortfolioPosition;
import com.basis.api.features.investment.position.PortfolioPositionRepository;
import com.basis.api.features.investment.position.PositionStatus;
import com.basis.api.features.stock.master.StockMaster;
import com.basis.api.shared.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.ZonedDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for aggregating portfolio positions by stock symbol
 * Provides stock grouping functionality with FIFO/LIFO selling strategies
 */
@Service
@Transactional(readOnly = true)
public class PositionAggregationService {

    private final PortfolioRepository portfolioRepository;
    private final PortfolioPositionRepository positionRepository;

    public PositionAggregationService(PortfolioRepository portfolioRepository,
                                    PortfolioPositionRepository positionRepository) {
        this.portfolioRepository = portfolioRepository;
        this.positionRepository = positionRepository;
    }

    /**
     * Get all stock groups for a portfolio
     */
    public List<StockGroupDTO> getStockGroups(UUID portfolioUuid, String userId) {
        Portfolio portfolio = portfolioRepository.findByUuidAndUserId(portfolioUuid, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Portfolio not found with uuid: " + portfolioUuid));

        List<PortfolioPosition> positions = positionRepository.findByPortfolioIdAndPortfolioUserId(portfolio.getId(), userId);

        // Group positions by stock symbol
        Map<String, List<PortfolioPosition>> positionsBySymbol = positions.stream()
                .collect(Collectors.groupingBy(pos -> pos.getStock().getSymbol()));

        return positionsBySymbol.entrySet().stream()
                .map(entry -> createStockGroup(entry.getKey(), entry.getValue()))
                .sorted(Comparator.comparing(StockGroupDTO::getSymbol))
                .collect(Collectors.toList());
    }

    /**
     * Get a specific stock group for a portfolio
     */
    public StockGroupDTO getStockGroup(UUID portfolioUuid, String symbol, String userId) {
        Portfolio portfolio = portfolioRepository.findByUuidAndUserId(portfolioUuid, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Portfolio not found with uuid: " + portfolioUuid));

        List<PortfolioPosition> positions = positionRepository.findByPortfolioIdAndPortfolioUserIdAndStockSymbol(
                portfolio.getId(), userId, symbol);

        if (positions.isEmpty()) {
            throw new ResourceNotFoundException("No positions found for stock symbol: " + symbol);
        }

        return createStockGroup(symbol, positions);
    }

    /**
     * Create a stock group DTO from a list of positions for the same symbol
     */
    private StockGroupDTO createStockGroup(String symbol, List<PortfolioPosition> positions) {
        if (positions.isEmpty()) {
            throw new IllegalArgumentException("Cannot create stock group from empty positions list");
        }

        StockMaster stock = positions.get(0).getStock();
        
        // Sort positions by creation date for FIFO ordering
        positions.sort(Comparator.comparing(PortfolioPosition::getCreatedAt));

        // Calculate aggregated values
        BigDecimal totalCost = positions.stream()
                .map(PortfolioPosition::calculateTotalCost)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalCurrentValue = positions.stream()
                .map(pos -> pos.calculateCurrentValue(stock.getCurrentPriceSafe()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        int totalQuantity = positions.stream()
                .mapToInt(pos -> pos.getQuantity().intValue())
                .sum();

        int activeQuantity = positions.stream()
                .filter(pos -> pos.getStatus() == PositionStatus.ACTIVE)
                .mapToInt(pos -> pos.getQuantity().intValue())
                .sum();

        int soldQuantity = positions.stream()
                .filter(pos -> pos.getStatus() == PositionStatus.CLOSED)
                .mapToInt(pos -> pos.getQuantity().intValue())
                .sum();

        // Calculate weighted average purchase price
        BigDecimal totalShares = BigDecimal.valueOf(totalQuantity);
        BigDecimal weightedAveragePrice = BigDecimal.ZERO;
        if (totalShares.compareTo(BigDecimal.ZERO) > 0) {
            weightedAveragePrice = totalCost.divide(totalShares, 4, RoundingMode.HALF_UP);
        }

        // Calculate gain/loss
        BigDecimal totalGainLoss = totalCurrentValue.subtract(totalCost);
        BigDecimal gainLossPercentage = BigDecimal.ZERO;
        if (totalCost.compareTo(BigDecimal.ZERO) > 0) {
            gainLossPercentage = totalGainLoss.divide(totalCost, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
        }

        // Find date range
        ZonedDateTime firstPurchaseDate = positions.stream()
                .map(PortfolioPosition::getCreatedAt)
                .min(ZonedDateTime::compareTo)
                .orElse(null);

        ZonedDateTime lastPurchaseDate = positions.stream()
                .map(PortfolioPosition::getCreatedAt)
                .max(ZonedDateTime::compareTo)
                .orElse(null);

        // Convert positions to DTOs
        List<StockGroupPositionDTO> positionDTOs = positions.stream()
                .map(this::convertToPositionDTO)
                .collect(Collectors.toList());

        // Build stock group DTO
        StockGroupDTO stockGroup = new StockGroupDTO();
        stockGroup.setSymbol(symbol);
        stockGroup.setCompanyName(stock.getCompanyName());
        stockGroup.setCurrentPrice(stock.getCurrentPriceSafe());
        stockGroup.setTotalQuantity(totalQuantity);
        stockGroup.setActiveQuantity(activeQuantity);
        stockGroup.setSoldQuantity(soldQuantity);
        stockGroup.setWeightedAveragePrice(weightedAveragePrice);
        stockGroup.setTotalCost(totalCost);
        stockGroup.setTotalCurrentValue(totalCurrentValue);
        stockGroup.setTotalGainLoss(totalGainLoss);
        stockGroup.setGainLossPercentage(gainLossPercentage);
        stockGroup.setFirstPurchaseDate(firstPurchaseDate);
        stockGroup.setLastPurchaseDate(lastPurchaseDate);
        stockGroup.setPositions(positionDTOs);
        stockGroup.setPositionCount(positions.size());

        return stockGroup;
    }

    /**
     * Convert PortfolioPosition to StockGroupPositionDTO
     */
    private StockGroupPositionDTO convertToPositionDTO(PortfolioPosition position) {
        StockGroupPositionDTO dto = new StockGroupPositionDTO();
        dto.setId(position.getId());
        dto.setUuid(position.getUuid());
        dto.setQuantity(position.getQuantity().intValue());
        dto.setPurchasePrice(position.getAverageCostBasis());
        dto.setTotalCost(position.calculateTotalCost());
        dto.setCurrentValue(position.calculateCurrentValue(position.getStock().getCurrentPriceSafe()));
        dto.setStatus(position.getStatus());
        dto.setPurchaseDate(position.getCreatedAt());
        dto.setLastUpdated(position.getUpdatedAt());

        // Calculate individual position gain/loss
        BigDecimal currentValue = position.calculateCurrentValue(position.getStock().getCurrentPriceSafe());
        BigDecimal totalCost = position.calculateTotalCost();
        BigDecimal gainLoss = currentValue.subtract(totalCost);
        dto.setGainLoss(gainLoss);

        BigDecimal gainLossPercentage = BigDecimal.ZERO;
        if (totalCost.compareTo(BigDecimal.ZERO) > 0) {
            gainLossPercentage = gainLoss.divide(totalCost, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
        }
        dto.setGainLossPercentage(gainLossPercentage);

        return dto;
    }

    /**
     * Get stock groups with filtering options
     */
    public List<StockGroupDTO> getStockGroupsFiltered(UUID portfolioUuid, String userId, 
                                                     String searchTerm, String sortBy, String sortDirection) {
        List<StockGroupDTO> stockGroups = getStockGroups(portfolioUuid, userId);

        // Apply search filter
        if (searchTerm != null && !searchTerm.trim().isEmpty()) {
            String search = searchTerm.toLowerCase().trim();
            stockGroups = stockGroups.stream()
                    .filter(group -> 
                        group.getSymbol().toLowerCase().contains(search) ||
                        group.getCompanyName().toLowerCase().contains(search))
                    .collect(Collectors.toList());
        }

        // Apply sorting
        if (sortBy != null && !sortBy.trim().isEmpty()) {
            Comparator<StockGroupDTO> comparator = getStockGroupComparator(sortBy);
            if ("desc".equalsIgnoreCase(sortDirection)) {
                comparator = comparator.reversed();
            }
            stockGroups.sort(comparator);
        }

        return stockGroups;
    }

    /**
     * Get comparator for stock group sorting
     */
    private Comparator<StockGroupDTO> getStockGroupComparator(String sortBy) {
        switch (sortBy.toLowerCase()) {
            case "symbol":
                return Comparator.comparing(StockGroupDTO::getSymbol);
            case "company":
                return Comparator.comparing(StockGroupDTO::getCompanyName);
            case "gainloss":
                return Comparator.comparing(StockGroupDTO::getTotalGainLoss);
            case "percentage":
                return Comparator.comparing(StockGroupDTO::getGainLossPercentage);
            case "value":
                return Comparator.comparing(StockGroupDTO::getTotalCurrentValue);
            case "quantity":
                return Comparator.comparing(StockGroupDTO::getTotalQuantity);
            case "date":
                return Comparator.comparing(StockGroupDTO::getLastPurchaseDate);
            default:
                return Comparator.comparing(StockGroupDTO::getSymbol);
        }
    }
}