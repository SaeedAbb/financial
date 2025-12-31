package com.basis.api.features.statement.services;

import com.basis.api.features.investment.portfolio.Portfolio;
import com.basis.api.features.investment.portfolio.PortfolioRepository;
import com.basis.api.features.statement.ImportBatch;
import com.basis.api.features.statement.ImportBatchRepository;
import com.basis.api.features.statement.ImportStatus;
import com.basis.api.features.statement.dto.ImportRequestDTO;
import com.basis.api.features.statement.dto.ImportResultDTO;
import com.basis.api.features.statement.dto.ImportTransactionDTO;
import com.basis.api.features.statement.providers.StatementProvider;
import com.basis.api.features.transaction.Transaction;
import com.basis.api.features.transaction.TransactionRepository;
import com.basis.api.features.transaction.TransactionType;
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
    private final TransactionRepository transactionRepository;
    
    public StatementImportService(
            ImportBatchRepository importBatchRepository,
            PortfolioRepository portfolioRepository,
            TransactionRepository transactionRepository) {
        this.importBatchRepository = importBatchRepository;
        this.portfolioRepository = portfolioRepository;
        this.transactionRepository = transactionRepository;
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
        
        for (ImportTransactionDTO transaction : transactions) {
            try {
                Transaction transactionEntity = createTransaction(transaction, batch, userId, portfolio);
                transactionEntity = transactionRepository.save(transactionEntity);
                
                batch.incrementSuccess();
                results.add(new ImportResultDTO.TransactionImportResultDTO(
                    transactionEntity.getId(),
                    transactionEntity.getUuid(),
                    transactionEntity.getSymbol()
                ));
                
            } catch (Exception e) {
                logger.error("Failed to process transaction: {}", transaction.getDescription(), e);
                batch.incrementFailure();
                results.add(new ImportResultDTO.TransactionImportResultDTO(e.getMessage()));
            }
        }
        
        return results;
    }
    
    private Transaction createTransaction(
            ImportTransactionDTO importTx,
            ImportBatch batch,
            String userId,
            Portfolio portfolio) {
        
        Transaction transaction = new Transaction();
        transaction.setUserId(userId);
        transaction.setTransactionCategory(com.basis.api.features.transaction.TransactionCategory.STOCK);
        transaction.setTransactionType(
            "BUY".equals(importTx.getType()) ? TransactionType.BUY : TransactionType.SELL
        );
        transaction.setReferenceId(portfolio.getId());
        transaction.setReferenceType("PORTFOLIO");
        transaction.setSymbol(importTx.getRawSymbol() != null ? importTx.getRawSymbol() : importTx.getDescription());
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
        // Store ISIN in providerReference field for now
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