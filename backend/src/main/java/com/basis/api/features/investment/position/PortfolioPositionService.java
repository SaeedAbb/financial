package com.basis.api.features.investment.position;

import com.basis.api.features.investment.portfolio.Portfolio;
import com.basis.api.features.investment.portfolio.PortfolioRepository;
import com.basis.api.features.investment.position.dto.BuyPositionRequest;
import com.basis.api.features.investment.position.dto.PortfolioPositionDTO;
import com.basis.api.features.investment.position.dto.SellPositionRequest;
import com.basis.api.features.stock.master.StockMaster;
import com.basis.api.features.stock.master.StockMasterService;
import com.basis.api.features.stock.master.dto.StockMasterDTO;
import com.basis.api.features.transaction.Transaction;
import com.basis.api.features.transaction.TransactionRepository;
import com.basis.api.features.transaction.TransactionType;
import com.basis.api.shared.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class PortfolioPositionService {

    private final PortfolioPositionRepository positionRepository;
    private final PortfolioRepository portfolioRepository;
    private final StockMasterService stockMasterService;
    private final TransactionRepository transactionRepository;

    public PortfolioPositionService(PortfolioPositionRepository positionRepository,
                                    PortfolioRepository portfolioRepository,
                                    StockMasterService stockMasterService,
                                    TransactionRepository transactionRepository) {
        this.positionRepository = positionRepository;
        this.portfolioRepository = portfolioRepository;
        this.stockMasterService = stockMasterService;
        this.transactionRepository = transactionRepository;
    }

    public PortfolioPositionDTO buyStock(Long portfolioId, String userId, BuyPositionRequest request) {
        // Verify portfolio ownership
        Portfolio portfolio = portfolioRepository.findById(portfolioId)
                .orElseThrow(() -> new ResourceNotFoundException("Portfolio not found with id: " + portfolioId));
        
        if (!portfolio.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Portfolio does not belong to user");
        }

        // Find or create stock in master table
        StockMaster stock = stockMasterService.findOrCreateStock(
                request.getStockSymbol(),
                request.getCompanyName() != null ? request.getCompanyName() : request.getStockSymbol()
        );

        // Find or create position
        PortfolioPosition position = positionRepository.findByPortfolioIdAndStockId(portfolioId, stock.getId())
                .orElseGet(() -> {
                    PortfolioPosition newPosition = new PortfolioPosition(portfolio, stock);
                    return positionRepository.save(newPosition);
                });

        // Add shares to position
        position.addShares(request.getQuantity(), request.getPricePerShare(), request.getTransactionDate());
        PortfolioPosition savedPosition = positionRepository.save(position);

        // Create buy transaction
        Transaction transaction = Transaction.createStockTransaction(
                userId,
                TransactionType.BUY,
                savedPosition.getId(),
                stock.getSymbol(),
                request.getQuantity(),
                request.getPricePerShare(),
                request.getTransactionDate()
        );
        transactionRepository.save(transaction);

        return toDTO(savedPosition, null); // No current price available
    }

    public PortfolioPositionDTO sellStock(String userId, SellPositionRequest request) {
        // Get position
        PortfolioPosition position = positionRepository.findById(request.getPositionId())
                .orElseThrow(() -> new ResourceNotFoundException("Position not found with id: " + request.getPositionId()));

        // Verify ownership
        if (!position.getPortfolio().getUserId().equals(userId)) {
            throw new IllegalArgumentException("Position does not belong to user");
        }

        // Remove shares from position
        position.removeShares(request.getQuantity(), request.getTransactionDate());
        PortfolioPosition savedPosition = positionRepository.save(position);

        // Create sell transaction
        Transaction transaction = Transaction.createStockTransaction(
                userId,
                TransactionType.SELL,
                savedPosition.getId(),
                position.getStock().getSymbol(),
                request.getQuantity(),
                request.getPricePerShare(),
                request.getTransactionDate()
        );
        transactionRepository.save(transaction);

        return toDTO(savedPosition, null); // No current price available
    }

    @Transactional(readOnly = true)
    public PortfolioPositionDTO getPosition(Long positionId, String userId) {
        PortfolioPosition position = positionRepository.findById(positionId)
                .orElseThrow(() -> new ResourceNotFoundException("Position not found with id: " + positionId));

        if (!position.getPortfolio().getUserId().equals(userId)) {
            throw new IllegalArgumentException("Position does not belong to user");
        }

        return toDTO(position, null); // No current price available
    }

    @Transactional(readOnly = true)
    public PortfolioPositionDTO getPositionByUuid(UUID uuid, String userId) {
        PortfolioPosition position = positionRepository.findByUuid(uuid)
                .orElseThrow(() -> new ResourceNotFoundException("Position not found with uuid: " + uuid));

        if (!position.getPortfolio().getUserId().equals(userId)) {
            throw new IllegalArgumentException("Position does not belong to user");
        }

        return toDTO(position, null); // No current price available
    }

    @Transactional(readOnly = true)
    public List<PortfolioPositionDTO> getPortfolioPositions(Long portfolioId, String userId) {
        Portfolio portfolio = portfolioRepository.findById(portfolioId)
                .orElseThrow(() -> new ResourceNotFoundException("Portfolio not found with id: " + portfolioId));

        if (!portfolio.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Portfolio does not belong to user");
        }

        return positionRepository.findByPortfolioId(portfolioId).stream()
                .map(position -> toDTO(position, null))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PortfolioPositionDTO> getActivePortfolioPositions(Long portfolioId, String userId) {
        Portfolio portfolio = portfolioRepository.findById(portfolioId)
                .orElseThrow(() -> new ResourceNotFoundException("Portfolio not found with id: " + portfolioId));

        if (!portfolio.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Portfolio does not belong to user");
        }

        return positionRepository.findByPortfolioIdAndStatus(portfolioId, PositionStatus.ACTIVE).stream()
                .map(position -> toDTO(position, null))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PortfolioPositionDTO> getUserPositions(String userId) {
        return positionRepository.findByUserId(userId).stream()
                .map(position -> toDTO(position, null))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PortfolioPositionDTO> getActiveUserPositions(String userId) {
        return positionRepository.findByUserIdAndStatus(userId, PositionStatus.ACTIVE).stream()
                .map(position -> toDTO(position, null))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public BigDecimal calculatePortfolioTotalValue(Long portfolioId, String userId) {
        Portfolio portfolio = portfolioRepository.findById(portfolioId)
                .orElseThrow(() -> new ResourceNotFoundException("Portfolio not found with id: " + portfolioId));

        if (!portfolio.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Portfolio does not belong to user");
        }

        BigDecimal totalValue = positionRepository.calculateTotalInvestmentValue(portfolioId);
        return totalValue != null ? totalValue : BigDecimal.ZERO;
    }

    private PortfolioPositionDTO toDTO(PortfolioPosition position, BigDecimal currentPrice) {
        PortfolioPositionDTO dto = new PortfolioPositionDTO();
        dto.setId(position.getId());
        dto.setUuid(position.getUuid());
        dto.setPortfolioId(position.getPortfolio().getId());
        
        // Convert stock to DTO
        StockMasterDTO stockDTO = new StockMasterDTO();
        stockDTO.setId(position.getStock().getId());
        stockDTO.setSymbol(position.getStock().getSymbol());
        stockDTO.setCompanyName(position.getStock().getCompanyName());
        stockDTO.setExchange(position.getStock().getExchange());
        stockDTO.setSector(position.getStock().getSector());
        dto.setStock(stockDTO);
        
        dto.setQuantity(position.getQuantity());
        dto.setAverageCostBasis(position.getAverageCostBasis());
        dto.setTotalCost(position.calculateTotalCost());
        
        // Calculate values if current price is provided
        if (currentPrice != null) {
            dto.setCurrentValue(position.calculateCurrentValue(currentPrice));
            dto.setUnrealizedGainLoss(position.calculateUnrealizedGainLoss(currentPrice));
            dto.setUnrealizedGainLossPercentage(position.calculateUnrealizedGainLossPercentage(currentPrice));
        }
        
        dto.setFirstPurchaseDate(position.getFirstPurchaseDate());
        dto.setLastTransactionDate(position.getLastTransactionDate());
        dto.setStatus(position.getStatus());
        dto.setCreatedAt(position.getCreatedAt());
        dto.setUpdatedAt(position.getUpdatedAt());
        
        return dto;
    }
}