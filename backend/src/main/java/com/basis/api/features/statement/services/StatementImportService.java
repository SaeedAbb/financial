package com.basis.api.features.statement.services;

import com.basis.api.features.investment.portfolio.Portfolio;
import com.basis.api.features.investment.portfolio.PortfolioRepository;
import com.basis.api.features.investment.position.PortfolioPosition;
import com.basis.api.features.investment.position.PortfolioPositionRepository;
import com.basis.api.features.statement.ImportBatch;
import com.basis.api.features.statement.ImportBatchRepository;
import com.basis.api.features.statement.ImportStatus;
import com.basis.api.features.statement.dto.ImportRequestDTO;
import com.basis.api.features.statement.dto.ImportResultDTO;
import com.basis.api.features.statement.dto.ImportTransactionDTO;
import com.basis.api.features.statement.providers.StatementProvider;
import com.basis.api.features.stock.master.StockMaster;
import com.basis.api.features.stock.master.StockMasterService;
import com.basis.api.features.transaction.Transaction;
import com.basis.api.features.transaction.TransactionRepository;
import com.basis.api.features.transaction.TransactionType;
import com.basis.api.features.transaction.services.TransactionFingerprintService;
import com.basis.api.shared.exception.ResourceNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class StatementImportService {
    
    private static final Logger logger = LoggerFactory.getLogger(StatementImportService.class);
    
    private final ImportBatchRepository importBatchRepository;
    private final PortfolioRepository portfolioRepository;
    private final PortfolioPositionRepository portfolioPositionRepository;
    private final TransactionRepository transactionRepository;
    private final StockMasterService stockMasterService;
    private final TransactionFingerprintService fingerprintService;
    
    public StatementImportService(
            ImportBatchRepository importBatchRepository,
            PortfolioRepository portfolioRepository,
            PortfolioPositionRepository portfolioPositionRepository,
            TransactionRepository transactionRepository,
            StockMasterService stockMasterService,
            TransactionFingerprintService fingerprintService) {
        this.importBatchRepository = importBatchRepository;
        this.portfolioRepository = portfolioRepository;
        this.portfolioPositionRepository = portfolioPositionRepository;
        this.transactionRepository = transactionRepository;
        this.stockMasterService = stockMasterService;
        this.fingerprintService = fingerprintService;
    }
    
    @Transactional
    public ImportResultDTO importTransactions(String userId, ImportRequestDTO importRequest) {
        logger.info("Starting import for user {} with {} transactions from {}",
                userId, importRequest.getTransactions().size(), importRequest.getProvider());
        
        // Validate portfolio ownership
        Portfolio portfolio = portfolioRepository.findByIdAndUserId(
                importRequest.getPortfolioId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Portfolio not found or access denied"));
        
        // Create import batch
        ImportBatch batch = new ImportBatch(
                userId,
                portfolio.getId(),
                importRequest.getProvider(),
                importRequest.getFileName()
        );
        batch.startProcessing(importRequest.getTransactions().size());
        batch = importBatchRepository.save(batch);
        
        try {
            // Process each transaction directly without LLM enhancement
            List<ImportResultDTO.TransactionImportResultDTO> results = 
                processTransactions(importRequest.getTransactions(), batch, userId, portfolio);
            
            // Update batch status
            batch.complete();
            importBatchRepository.save(batch);
            
            return ImportResultDTO.success(
                batch.getBatchId(),
                batch.getTransactionCount(),
                batch.getSuccessCount(),
                batch.getDuplicateCount(),
                results
            );
            
        } catch (Exception e) {
            logger.error("Import failed for batch {}", batch.getBatchId(), e);
            batch.fail(e.getMessage());
            importBatchRepository.save(batch);
            
            return ImportResultDTO.failure(batch.getBatchId(), e.getMessage());
        }
    }
    
    private List<ImportResultDTO.TransactionImportResultDTO> processTransactions(
            List<ImportTransactionDTO> transactions,
            ImportBatch batch,
            String userId,
            Portfolio portfolio) {
        
        List<ImportResultDTO.TransactionImportResultDTO> results = new ArrayList<>();
        
        // Pre-generate fingerprints for all transactions
        Map<ImportTransactionDTO, String> fingerprintMap = new HashMap<>();
        Set<String> allFingerprints = new HashSet<>();
        
        logger.info("Generating fingerprints for {} transactions to import into portfolio {}", 
            transactions.size(), portfolio.getId());
        
        for (ImportTransactionDTO transaction : transactions) {
            String fingerprint = fingerprintService.generateFingerprint(transaction, userId);
            fingerprintMap.put(transaction, fingerprint);
            allFingerprints.add(fingerprint);
            logger.debug("Transaction: {} on {} -> fingerprint: {}", 
                transaction.getRawSymbol() != null ? transaction.getRawSymbol() : transaction.getDescription(),
                transaction.getDate(), fingerprint);
        }
        
        logger.info("Generated {} unique fingerprints from {} transactions", 
            allFingerprints.size(), transactions.size());
        
        // Batch check for existing fingerprints within this portfolio
        logger.info("Checking for existing fingerprints in portfolio {} for user {}", 
            portfolio.getId(), userId);
        Set<String> existingFingerprints = transactionRepository.findExistingFingerprints(userId, portfolio.getId(), allFingerprints);
        
        logger.info("Found {} existing fingerprints out of {} checked in portfolio {}", 
            existingFingerprints.size(), allFingerprints.size(), portfolio.getId());
        
        if (!existingFingerprints.isEmpty()) {
            logger.info("Existing fingerprints found: {}", existingFingerprints);
        }
        
        // Process each transaction
        for (ImportTransactionDTO transaction : transactions) {
            String fingerprint = fingerprintMap.get(transaction);
            
            // Check if this is a duplicate
            if (existingFingerprints.contains(fingerprint)) {
                batch.incrementDuplicate();
                String symbol = transaction.getRawSymbol() != null ? transaction.getRawSymbol() : transaction.getDescription();
                results.add(ImportResultDTO.TransactionImportResultDTO.duplicate(symbol));
                logger.info("Skipping duplicate transaction: {} on {} with fingerprint: {} in portfolio: {}", 
                    symbol, transaction.getDate(), fingerprint, portfolio.getId());
                continue;
            }
            
            try {
                Transaction transactionEntity = createTransaction(transaction, batch, userId, portfolio);
                transactionEntity.setTransactionFingerprint(fingerprint);
                
                logger.debug("Saving transaction: {} on {} with fingerprint: {} to portfolio: {}", 
                    transactionEntity.getSymbol(), transactionEntity.getTransactionDate(), 
                    fingerprint, portfolio.getId());
                
                transactionEntity = transactionRepository.save(transactionEntity);
                
                batch.incrementSuccess();
                results.add(ImportResultDTO.TransactionImportResultDTO.success(
                    transactionEntity.getId(),
                    transactionEntity.getUuid(),
                    transactionEntity.getSymbol()
                ));
                
                logger.info("Successfully saved transaction: {} with ID: {} and fingerprint: {} to portfolio: {}", 
                    transactionEntity.getSymbol(), transactionEntity.getId(), fingerprint, portfolio.getId());
                
            } catch (Exception e) {
                logger.error("Failed to process transaction: {} on {} with fingerprint: {}", 
                    transaction.getDescription(), transaction.getDate(), fingerprint, e);
                batch.incrementFailure();
                results.add(ImportResultDTO.TransactionImportResultDTO.failure(e.getMessage()));
                
                // Check if it's a constraint violation
                if (e.getMessage() != null && e.getMessage().contains("constraint")) {
                    logger.error("CONSTRAINT VIOLATION: This indicates the fingerprint already exists in the database!");
                    logger.error("Transaction details: symbol={}, date={}, quantity={}, price={}", 
                        transaction.getRawSymbol(), transaction.getDate(), 
                        transaction.getQuantity(), transaction.getPricePerUnit());
                }
            }
        }
        
        return results;
    }
    
    private Transaction createTransaction(
            ImportTransactionDTO importTx,
            ImportBatch batch,
            String userId,
            Portfolio portfolio) {
        
        // First, find or create the stock master
        String symbol = importTx.getRawSymbol() != null ? importTx.getRawSymbol() : importTx.getDescription();
        
        final StockMaster stockMaster;
        if (importTx.getIsin() != null && !importTx.getIsin().isEmpty()) {
            stockMaster = stockMasterService.findOrEnrichByIsin(importTx.getIsin());
            symbol = stockMaster.getSymbol();
            logger.info("Found/created stock {} for ISIN {}", symbol, importTx.getIsin());
        } else {
            // If no ISIN, find or create by symbol
            stockMaster = stockMasterService.findOrCreateStock(symbol, importTx.getDescription());
        }
        
        // Find or create portfolio position for this stock
        PortfolioPosition position = portfolioPositionRepository
                .findByPortfolioIdAndStockId(portfolio.getId(), stockMaster.getId())
                .orElseGet(() -> {
                    PortfolioPosition newPosition = new PortfolioPosition(portfolio, stockMaster);
                    return portfolioPositionRepository.save(newPosition);
                });
        
        // Update position based on transaction type
        if ("BUY".equals(importTx.getType())) {
            position.addShares(importTx.getQuantity(), importTx.getPricePerUnit(), importTx.getDate());
        } else {
            position.removeShares(importTx.getQuantity(), importTx.getDate());
        }
        portfolioPositionRepository.save(position);
        
        // Create transaction referencing the portfolio position
        Transaction transaction = new Transaction();
        transaction.setUserId(userId);
        transaction.setPortfolioId(portfolio.getId());
        
        logger.debug("Creating transaction for portfolio: {} with position: {}", portfolio.getId(), position.getId());
        
        transaction.setTransactionCategory(com.basis.api.features.transaction.TransactionCategory.STOCK);
        transaction.setTransactionType(
            "BUY".equals(importTx.getType()) ? TransactionType.BUY : TransactionType.SELL
        );
        transaction.setReferenceId(position.getId());
        transaction.setReferenceType("PORTFOLIO_POSITION");
        transaction.setSymbol(symbol);
        transaction.setQuantity(importTx.getQuantity());
        transaction.setPricePerUnit(importTx.getPricePerUnit());
        transaction.setTotalAmount(importTx.getTotalAmount());
        transaction.setFees(importTx.getFees());
        transaction.setTransactionDate(importTx.getDate());
        transaction.setNotes("Imported from " + batch.getProvider().getDisplayName());
        
        // Set import tracking fields
        transaction.setImportProvider(batch.getProvider());
        transaction.setImportBatchId(batch.getBatchId());
        transaction.setOriginalDescription(importTx.getDescription());
        // Store ISIN in providerReference field
        transaction.setProviderReference(importTx.getIsin() != null ? importTx.getIsin() : importTx.getProviderReference());
        
        return transaction;
    }
    
    public List<ImportBatch> getUserImportHistory(String userId) {
        return importBatchRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }
    
    public List<ImportBatch> getPortfolioImportHistory(String userId, Long portfolioId) {
        // Verify portfolio ownership
        portfolioRepository.findByIdAndUserId(portfolioId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Portfolio not found or access denied"));
        
        return importBatchRepository.findByUserIdAndPortfolioIdOrderByCreatedAtDesc(userId, portfolioId);
    }
    
    public ImportBatch getImportBatchDetails(String userId, UUID batchId) {
        ImportBatch batch = importBatchRepository.findByBatchId(batchId)
                .orElseThrow(() -> new ResourceNotFoundException("Import batch not found"));
        
        if (!batch.getUserId().equals(userId)) {
            throw new ResourceNotFoundException("Import batch not found or access denied");
        }
        
        return batch;
    }
    
    public Map<String, Object> getProviderStatistics(String userId, StatementProvider provider) {
        List<ImportBatch> batches = importBatchRepository.findByUserIdAndProviderOrderByCreatedAtDesc(userId, provider);
        
        long totalImports = batches.size();
        long totalTransactions = batches.stream()
                .mapToLong(ImportBatch::getSuccessCount)
                .sum();
        
        double successRate = batches.isEmpty() ? 0.0 : 
            batches.stream()
                .filter(b -> b.getStatus() == ImportStatus.COMPLETED)
                .count() / (double) totalImports;
        
        ZonedDateTime lastImportDate = batches.isEmpty() ? null : batches.get(0).getCreatedAt();
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalImports", totalImports);
        stats.put("totalTransactions", totalTransactions);
        stats.put("successRate", successRate);
        stats.put("lastImportDate", lastImportDate);
        
        return stats;
    }
    
    public List<Map<String, String>> getSupportedProviders() {
        return Arrays.stream(StatementProvider.values())
                .map(provider -> {
                    Map<String, String> providerInfo = new HashMap<>();
                    providerInfo.put("id", provider.name());
                    providerInfo.put("displayName", provider.getDisplayName());
                    providerInfo.put("code", provider.getCode());
                    return providerInfo;
                })
                .collect(Collectors.toList());
    }
}