package com.basis.api.features.investment;

import com.basis.api.features.investment.dto.BuyStockRequest;
import com.basis.api.features.investment.dto.SellStockRequest;
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
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class StockService {

    private static final Logger logger = LoggerFactory.getLogger(StockService.class);
    
    private final StockRepository stockRepository;
    private final PortfolioRepository portfolioRepository;

    public StockService(StockRepository stockRepository, PortfolioRepository portfolioRepository) {
        this.stockRepository = stockRepository;
        this.portfolioRepository = portfolioRepository;
    }

    /**
     * Buy a stock (add to portfolio)
     */
    public StockDTO buyStock(String userId, BuyStockRequest request) {
        logger.info("Buying stock {} for user: {}", request.getSymbol(), userId);
        
        // Find the portfolio
        Portfolio portfolio = portfolioRepository.findByUuidAndUserId(request.getPortfolioUuid(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("Portfolio not found with UUID: " + request.getPortfolioUuid()));
        
        Stock stock = new Stock(
                portfolio,
                request.getSymbol().toUpperCase(),
                request.getCompanyName().trim(),
                request.getQuantity(),
                request.getPurchasePrice(),
                request.getPurchaseDate()
        );
        
        stock = stockRepository.save(stock);
        logger.info("Bought stock {} with UUID: {} for user: {}", stock.getSymbol(), stock.getUuid(), userId);
        
        return convertToDTO(stock);
    }

    /**
     * Sell a stock
     */
    public StockDTO sellStock(String userId, SellStockRequest request) {
        logger.info("Selling stock with UUID: {} for user: {}", request.getStockUuid(), userId);
        
        // Find the stock and verify ownership through portfolio
        Stock stock = stockRepository.findByUuid(request.getStockUuid())
                .orElseThrow(() -> new ResourceNotFoundException("Stock not found with UUID: " + request.getStockUuid()));
        
        // Verify user owns the portfolio containing this stock
        if (!stock.getPortfolio().getUserId().equals(userId)) {
            throw new ResourceNotFoundException("Stock not found with UUID: " + request.getStockUuid());
        }
        
        // Sell the stock
        stock.sellStock(request.getSalePrice(), request.getSaleDate());
        
        stock = stockRepository.save(stock);
        logger.info("Sold stock {} with UUID: {} for user: {}", stock.getSymbol(), stock.getUuid(), userId);
        
        return convertToDTO(stock);
    }

    /**
     * Get all stocks for a portfolio
     */
    @Transactional(readOnly = true)
    public List<StockDTO> getPortfolioStocks(String userId, UUID portfolioUuid) {
        logger.debug("Fetching stocks for portfolio UUID: {} and user: {}", portfolioUuid, userId);
        
        // Verify portfolio ownership
        Portfolio portfolio = portfolioRepository.findByUuidAndUserId(portfolioUuid, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Portfolio not found with UUID: " + portfolioUuid));
        
        List<Stock> stocks = stockRepository.findByPortfolioIdOrderByPurchaseDateDesc(portfolio.getId());
        
        return stocks.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get stocks for a portfolio with pagination
     */
    @Transactional(readOnly = true)
    public Page<StockDTO> getPortfolioStocks(String userId, UUID portfolioUuid, int page, int size, String sortBy, String sortDir) {
        logger.debug("Fetching stocks for portfolio UUID: {} and user: {} (page: {}, size: {})", portfolioUuid, userId, page, size);
        
        // Verify portfolio ownership
        Portfolio portfolio = portfolioRepository.findByUuidAndUserId(portfolioUuid, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Portfolio not found with UUID: " + portfolioUuid));
        
        Sort sort = Sort.by(Sort.Direction.fromString(sortDir), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<Stock> stocksPage = stockRepository.findByPortfolioIdOrderByPurchaseDateDesc(portfolio.getId(), pageable);
        
        return stocksPage.map(this::convertToDTO);
    }

    /**
     * Get active stocks for a portfolio
     */
    @Transactional(readOnly = true)
    public List<StockDTO> getActivePortfolioStocks(String userId, UUID portfolioUuid) {
        logger.debug("Fetching active stocks for portfolio UUID: {} and user: {}", portfolioUuid, userId);
        
        // Verify portfolio ownership
        Portfolio portfolio = portfolioRepository.findByUuidAndUserId(portfolioUuid, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Portfolio not found with UUID: " + portfolioUuid));
        
        List<Stock> stocks = stockRepository.findByPortfolioIdAndStatusOrderByPurchaseDateDesc(portfolio.getId(), StockStatus.ACTIVE);
        
        return stocks.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get sold stocks for a portfolio
     */
    @Transactional(readOnly = true)
    public List<StockDTO> getSoldPortfolioStocks(String userId, UUID portfolioUuid) {
        logger.debug("Fetching sold stocks for portfolio UUID: {} and user: {}", portfolioUuid, userId);
        
        // Verify portfolio ownership
        Portfolio portfolio = portfolioRepository.findByUuidAndUserId(portfolioUuid, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Portfolio not found with UUID: " + portfolioUuid));
        
        List<Stock> stocks = stockRepository.findByPortfolioIdAndStatusOrderByPurchaseDateDesc(portfolio.getId(), StockStatus.SOLD);
        
        return stocks.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get a specific stock by UUID
     */
    @Transactional(readOnly = true)
    public StockDTO getStockByUuid(String userId, UUID uuid) {
        logger.debug("Fetching stock with UUID: {} for user: {}", uuid, userId);
        
        Stock stock = stockRepository.findByUuid(uuid)
                .orElseThrow(() -> new ResourceNotFoundException("Stock not found with UUID: " + uuid));
        
        // Verify user owns the portfolio containing this stock
        if (!stock.getPortfolio().getUserId().equals(userId)) {
            throw new ResourceNotFoundException("Stock not found with UUID: " + uuid);
        }
        
        return convertToDTO(stock);
    }

    /**
     * Get all stocks for a user by symbol
     */
    @Transactional(readOnly = true)
    public List<StockDTO> getStocksBySymbol(String userId, String symbol) {
        logger.debug("Fetching stocks with symbol: {} for user: {}", symbol, userId);
        
        List<Stock> stocks = stockRepository.findByUserIdAndSymbolOrderByPurchaseDateDesc(userId, symbol.toUpperCase());
        
        return stocks.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get stocks within date range
     */
    @Transactional(readOnly = true)
    public List<StockDTO> getStocksInDateRange(String userId, LocalDate startDate, LocalDate endDate) {
        logger.debug("Fetching stocks for user: {} between {} and {}", userId, startDate, endDate);
        
        List<Stock> stocks = stockRepository.findByUserIdAndPurchaseDateBetweenOrderByPurchaseDateDesc(
                userId, startDate, endDate);
        
        return stocks.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get total investment value for a user
     */
    @Transactional(readOnly = true)
    public BigDecimal getTotalInvestmentValue(String userId) {
        logger.debug("Calculating total investment value for user: {}", userId);
        return stockRepository.getTotalInvestmentValueByUserId(userId);
    }

    /**
     * Get total gain/loss for a user
     */
    @Transactional(readOnly = true)
    public BigDecimal getTotalGainLoss(String userId) {
        logger.debug("Calculating total gain/loss for user: {}", userId);
        return stockRepository.getTotalGainLossByUserId(userId);
    }

    /**
     * Get distinct stock symbols for a user
     */
    @Transactional(readOnly = true)
    public List<String> getDistinctSymbols(String userId) {
        logger.debug("Fetching distinct stock symbols for user: {}", userId);
        return stockRepository.getDistinctSymbolsByUserId(userId);
    }

    /**
     * Get total stocks count for a user
     */
    @Transactional(readOnly = true)
    public long getStocksCount(String userId) {
        logger.debug("Counting stocks for user: {}", userId);
        return stockRepository.countByUserId(userId);
    }

    /**
     * Delete a stock (for admin purposes - normally stocks are sold, not deleted)
     */
    public void deleteStock(String userId, UUID uuid) {
        logger.info("Deleting stock with UUID: {} for user: {}", uuid, userId);
        
        Stock stock = stockRepository.findByUuid(uuid)
                .orElseThrow(() -> new ResourceNotFoundException("Stock not found with UUID: " + uuid));
        
        // Verify user owns the portfolio containing this stock
        if (!stock.getPortfolio().getUserId().equals(userId)) {
            throw new ResourceNotFoundException("Stock not found with UUID: " + uuid);
        }
        
        stockRepository.deleteByUuidAndPortfolioId(uuid, stock.getPortfolio().getId());
        logger.info("Deleted stock with UUID: {} for user: {}", uuid, userId);
    }

    /**
     * Convert Stock entity to StockDTO
     */
    private StockDTO convertToDTO(Stock stock) {
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

        // Calculate derived values
        dto.setInvestmentValue(stock.calculateInvestmentValue());
        
        if (stock.getStatus() == StockStatus.SOLD) {
            dto.setGainLoss(stock.calculateGainLoss());
            dto.setGainLossPercentage(stock.calculateGainLossPercentage());
        } else {
            dto.setGainLoss(BigDecimal.ZERO);
            dto.setGainLossPercentage(BigDecimal.ZERO);
        }

        return dto;
    }
}