package com.basis.api.features.investment.portfolio;

import com.basis.api.features.investment.portfolio.dto.CreatePortfolioRequest;
import com.basis.api.features.investment.portfolio.dto.PortfolioDTO;
import com.basis.api.features.statement.ImportBatchRepository;
import com.basis.api.features.statement.ImportBatch;
import com.basis.api.features.transaction.TransactionRepository;
import com.basis.api.features.transaction.Transaction;
import com.basis.api.shared.exception.ResourceNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class PortfolioService {

    private static final Logger logger = LoggerFactory.getLogger(PortfolioService.class);

    private final PortfolioRepository portfolioRepository;
    private final ImportBatchRepository importBatchRepository;
    private final TransactionRepository transactionRepository;

    public PortfolioService(PortfolioRepository portfolioRepository,
                          ImportBatchRepository importBatchRepository,
                          TransactionRepository transactionRepository) {
        this.portfolioRepository = portfolioRepository;
        this.importBatchRepository = importBatchRepository;
        this.transactionRepository = transactionRepository;
    }

    public PortfolioDTO createPortfolio(CreatePortfolioRequest request, String userId) {
        logger.debug("Creating portfolio for user: {}", userId);
        
        Portfolio portfolio = new Portfolio(userId, request.getName(), request.getDescription());
        Portfolio savedPortfolio = portfolioRepository.save(portfolio);
        
        logger.info("Created portfolio with ID: {} for user: {}", savedPortfolio.getId(), userId);
        return toDTO(savedPortfolio);
    }

    @Transactional(readOnly = true)
    public PortfolioDTO getPortfolio(Long id, String userId) {
        logger.debug("Fetching portfolio ID: {} for user: {}", id, userId);
        
        Portfolio portfolio = portfolioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Portfolio not found with id: " + id));
        
        if (!portfolio.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Portfolio does not belong to user");
        }
        
        return toDTO(portfolio);
    }

    @Transactional(readOnly = true)
    public PortfolioDTO getPortfolioByUuid(UUID uuid, String userId) {
        logger.debug("Fetching portfolio UUID: {} for user: {}", uuid, userId);
        
        Portfolio portfolio = portfolioRepository.findByUuid(uuid)
                .orElseThrow(() -> new ResourceNotFoundException("Portfolio not found with UUID: " + uuid));
        
        if (!portfolio.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Portfolio does not belong to user");
        }
        
        return toDTO(portfolio);
    }

    @Transactional(readOnly = true)
    public List<PortfolioDTO> getUserPortfolios(String userId) {
        logger.debug("Fetching portfolios for user: {}", userId);
        
        List<Portfolio> portfolios = portfolioRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return portfolios.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<PortfolioDTO> getUserPortfoliosPaged(String userId, int page, int size, String sortBy, String sortDir) {
        logger.debug("Fetching paged portfolios for user: {} (page: {}, size: {})", userId, page, size);
        
        Sort sort = sortDir.equalsIgnoreCase("desc") ? 
            Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        return portfolioRepository.findByUserId(userId, pageable)
                .map(this::toDTO);
    }

    public PortfolioDTO updatePortfolio(Long id, CreatePortfolioRequest request, String userId) {
        logger.debug("Updating portfolio ID: {} for user: {}", id, userId);
        
        Portfolio portfolio = portfolioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Portfolio not found with id: " + id));
        
        if (!portfolio.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Portfolio does not belong to user");
        }
        
        portfolio.setName(request.getName());
        portfolio.setDescription(request.getDescription());
        
        Portfolio updatedPortfolio = portfolioRepository.save(portfolio);
        logger.info("Updated portfolio ID: {} for user: {}", id, userId);
        
        return toDTO(updatedPortfolio);
    }

    public void deletePortfolio(Long id, String userId) {
        logger.debug("Deleting portfolio ID: {} for user: {}", id, userId);
        
        Portfolio portfolio = portfolioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Portfolio not found with id: " + id));
        
        if (!portfolio.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Portfolio does not belong to user");
        }
        
        // Delete all transactions associated with this portfolio
        List<Transaction> transactions = transactionRepository.findByUserIdAndPortfolioId(userId, id);
        if (!transactions.isEmpty()) {
            logger.info("Deleting {} transactions for portfolio ID: {}", transactions.size(), id);
            transactionRepository.deleteAll(transactions);
        }
        
        // Delete all import batches associated with this portfolio
        List<ImportBatch> importBatches = importBatchRepository.findByUserIdAndPortfolioIdOrderByCreatedAtDesc(userId, id);
        if (!importBatches.isEmpty()) {
            logger.info("Deleting {} import batches for portfolio ID: {}", importBatches.size(), id);
            importBatchRepository.deleteAll(importBatches);
        }
        
        portfolioRepository.delete(portfolio);
        logger.info("Deleted portfolio ID: {} for user: {}", id, userId);
    }

    @Transactional(readOnly = true)
    public long getUserPortfolioCount(String userId) {
        return portfolioRepository.countByUserId(userId);
    }

    private PortfolioDTO toDTO(Portfolio portfolio) {
        PortfolioDTO dto = new PortfolioDTO();
        dto.setId(portfolio.getId());
        dto.setUuid(portfolio.getUuid());
        dto.setUserId(portfolio.getUserId());
        dto.setName(portfolio.getName());
        dto.setDescription(portfolio.getDescription());
        dto.setCreatedAt(portfolio.getCreatedAt());
        dto.setUpdatedAt(portfolio.getUpdatedAt());
        return dto;
    }
}