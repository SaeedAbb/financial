package com.basis.api.features.investment;

import com.basis.api.features.investment.dto.CreatePortfolioRequest;
import com.basis.api.features.investment.dto.PortfolioDTO;
import com.basis.api.features.investment.dto.StockDTO;
import com.basis.api.shared.exception.ResourceNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class PortfolioService {

    private static final Logger logger = LoggerFactory.getLogger(PortfolioService.class);
    
    private final PortfolioRepository portfolioRepository;

    public PortfolioService(PortfolioRepository portfolioRepository) {
        this.portfolioRepository = portfolioRepository;
    }

    /**
     * Create a new portfolio
     */
    public PortfolioDTO createPortfolio(String userId, CreatePortfolioRequest request) {
        logger.info("Creating new portfolio for user: {}", userId);
        
        // Check for duplicate portfolio name
        if (portfolioRepository.existsByUserIdAndNameIgnoreCase(userId, request.getName())) {
            throw new IllegalArgumentException("Portfolio with name '" + request.getName() + "' already exists");
        }
        
        Portfolio portfolio = new Portfolio(
                userId,
                request.getName().trim(),
                request.getDescription() != null ? request.getDescription().trim() : null
        );
        
        portfolio = portfolioRepository.save(portfolio);
        logger.info("Created portfolio with UUID: {} for user: {}", portfolio.getUuid(), userId);
        
        return convertToDTO(portfolio, true);
    }

    /**
     * Get all portfolios for a user with pagination
     */
    @Transactional(readOnly = true)
    public Page<PortfolioDTO> getUserPortfolios(String userId, int page, int size, String sortBy, String sortDir) {
        logger.debug("Fetching portfolios for user: {} (page: {}, size: {})", userId, page, size);
        
        Sort sort = Sort.by(Sort.Direction.fromString(sortDir), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<Portfolio> portfoliosPage = portfolioRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        
        return portfoliosPage.map(portfolio -> convertToDTO(portfolio, false));
    }

    /**
     * Get all portfolios for a user (no pagination)
     */
    @Transactional(readOnly = true)
    public List<PortfolioDTO> getAllUserPortfolios(String userId) {
        logger.debug("Fetching all portfolios for user: {}", userId);
        
        List<Portfolio> portfolios = portfolioRepository.findByUserIdOrderByCreatedAtDesc(userId);
        
        return portfolios.stream()
                .map(portfolio -> convertToDTO(portfolio, false))
                .collect(Collectors.toList());
    }

    /**
     * Get a specific portfolio by UUID
     */
    @Transactional(readOnly = true)
    public PortfolioDTO getPortfolioByUuid(String userId, UUID uuid) {
        logger.debug("Fetching portfolio with UUID: {} for user: {}", uuid, userId);
        
        Portfolio portfolio = portfolioRepository.findByUuidAndUserId(uuid, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Portfolio not found with UUID: " + uuid));
        
        return convertToDTO(portfolio, true);
    }

    /**
     * Update an existing portfolio
     */
    public PortfolioDTO updatePortfolio(String userId, UUID uuid, CreatePortfolioRequest request) {
        logger.info("Updating portfolio with UUID: {} for user: {}", uuid, userId);
        
        Portfolio portfolio = portfolioRepository.findByUuidAndUserId(uuid, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Portfolio not found with UUID: " + uuid));
        
        // Check for duplicate portfolio name (excluding current portfolio)
        if (portfolioRepository.existsByUserIdAndNameIgnoreCaseAndUuidNot(userId, request.getName(), uuid)) {
            throw new IllegalArgumentException("Portfolio with name '" + request.getName() + "' already exists");
        }
        
        portfolio.setName(request.getName().trim());
        portfolio.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);
        
        portfolio = portfolioRepository.save(portfolio);
        logger.info("Updated portfolio with UUID: {} for user: {}", uuid, userId);
        
        return convertToDTO(portfolio, true);
    }

    /**
     * Delete a portfolio
     */
    public void deletePortfolio(String userId, UUID uuid) {
        logger.info("Deleting portfolio with UUID: {} for user: {}", uuid, userId);
        
        Portfolio portfolio = portfolioRepository.findByUuidAndUserId(uuid, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Portfolio not found with UUID: " + uuid));
        
        // Check if portfolio has any stocks
        if (!portfolio.getStocks().isEmpty()) {
            throw new IllegalStateException("Cannot delete portfolio that contains stocks. Please sell or transfer all stocks first.");
        }
        
        portfolioRepository.deleteByUuidAndUserId(uuid, userId);
        logger.info("Deleted portfolio with UUID: {} for user: {}", uuid, userId);
    }

    /**
     * Get portfolios count for a user
     */
    @Transactional(readOnly = true)
    public long getPortfoliosCount(String userId) {
        logger.debug("Counting portfolios for user: {}", userId);
        return portfolioRepository.countByUserId(userId);
    }

    /**
     * Search portfolios by name
     */
    @Transactional(readOnly = true)
    public List<PortfolioDTO> searchPortfoliosByName(String userId, String name) {
        logger.debug("Searching portfolios for user: {} with name containing: {}", userId, name);
        
        List<Portfolio> portfolios = portfolioRepository.findByUserIdAndNameContainingIgnoreCase(userId, name);
        
        return portfolios.stream()
                .map(portfolio -> convertToDTO(portfolio, false))
                .collect(Collectors.toList());
    }

    /**
     * Convert Portfolio entity to PortfolioDTO
     */
    private PortfolioDTO convertToDTO(Portfolio portfolio, boolean includeStocks) {
        PortfolioDTO dto = new PortfolioDTO(
                portfolio.getId(),
                portfolio.getUuid(),
                portfolio.getName(),
                portfolio.getDescription(),
                portfolio.getCreatedAt(),
                portfolio.getUpdatedAt()
        );

        // Calculate performance metrics
        List<Stock> activeStocks = portfolio.getActiveStocks();
        List<Stock> soldStocks = portfolio.getSoldStocks();

        dto.setActiveStocksCount(activeStocks.size());
        dto.setSoldStocksCount(soldStocks.size());
        
        // Calculate total investment for active stocks
        BigDecimal totalInvestment = activeStocks.stream()
                .map(Stock::calculateInvestmentValue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        dto.setTotalInvestment(totalInvestment);

        // Calculate total gain/loss for sold stocks
        BigDecimal totalGainLoss = soldStocks.stream()
                .map(Stock::calculateGainLoss)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        dto.setTotalGainLoss(totalGainLoss);

        // Calculate gain/loss percentage
        if (totalInvestment.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal gainLossPercentage = totalGainLoss
                    .divide(totalInvestment, 4, RoundingMode.HALF_UP)
                    .multiply(new BigDecimal("100"));
            dto.setGainLossPercentage(gainLossPercentage);
        } else {
            dto.setGainLossPercentage(BigDecimal.ZERO);
        }

        // Include stocks if requested
        if (includeStocks) {
            List<StockDTO> stockDTOs = portfolio.getStocks().stream()
                    .map(this::convertStockToDTO)
                    .collect(Collectors.toList());
            dto.setStocks(stockDTOs);
        }

        return dto;
    }

    /**
     * Convert Stock entity to StockDTO (basic conversion for portfolio view)
     */
    private StockDTO convertStockToDTO(Stock stock) {
        StockDTO dto = new StockDTO(
                stock.getId(),
                stock.getUuid(),
                stock.getPortfolio().getId(),
                stock.getPortfolio().getName(),
                stock.getSymbol(),
                stock.getCompanyName(),
                stock.getQuantity(),
                stock.getPurchasePrice(),
                stock.getPurchaseDate(),
                stock.getStatus(),
                stock.getSalePrice(),
                stock.getSaleDate(),
                stock.getCreatedAt(),
                stock.getUpdatedAt()
        );

        // Calculate investment value
        dto.setInvestmentValue(stock.calculateInvestmentValue());
        
        // Calculate gain/loss for sold stocks
        if (stock.getStatus() == StockStatus.SOLD) {
            dto.setGainLoss(stock.calculateGainLoss());
            dto.setGainLossPercentage(stock.calculateGainLossPercentage());
        }

        return dto;
    }
}