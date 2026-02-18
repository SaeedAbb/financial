package com.basis.api.features.transaction;

import com.basis.api.features.transaction.dto.TransactionDTO;
import com.basis.api.features.transaction.dto.TransactionSummaryDTO;
import com.basis.api.shared.exception.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageImpl;

@Service
@Transactional
public class TransactionService {

    private final TransactionRepository transactionRepository;

    public TransactionService(TransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    @Transactional(readOnly = true)
    public TransactionDTO getTransaction(Long id, String userId) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found with id: " + id));
        
        if (!transaction.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Transaction does not belong to user");
        }
        
        return toDTO(transaction);
    }

    @Transactional(readOnly = true)
    public TransactionDTO getTransactionByUuid(UUID uuid, String userId) {
        Transaction transaction = transactionRepository.findByUuid(uuid)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found with uuid: " + uuid));
        
        if (!transaction.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Transaction does not belong to user");
        }
        
        return toDTO(transaction);
    }

    @Transactional(readOnly = true)
    public List<TransactionDTO> getUserTransactions(String userId) {
        return transactionRepository.findByUserId(userId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<TransactionDTO> getUserTransactionsPaged(String userId, Pageable pageable) {
        return transactionRepository.findByUserId(userId, pageable)
                .map(this::toDTO);
    }

    @Transactional(readOnly = true)
    public List<TransactionDTO> getUserTransactionsByCategory(String userId, TransactionCategory category) {
        return transactionRepository.findByUserIdAndTransactionCategory(userId, category).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TransactionDTO> getUserTransactionsByType(String userId, TransactionType type) {
        return transactionRepository.findByUserIdAndTransactionType(userId, type).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TransactionDTO> getUserTransactionsByDateRange(String userId, LocalDate startDate, LocalDate endDate) {
        return transactionRepository.findByUserIdAndDateRange(userId, startDate, endDate).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TransactionDTO> getUserTransactionsBySymbol(String userId, String symbol) {
        return transactionRepository.findByUserIdAndSymbol(userId, symbol).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TransactionDTO> getPositionTransactions(Long positionId, String userId) {
        // First, verify the position belongs to the user by checking a transaction
        List<Transaction> transactions = transactionRepository.findByReferenceIdAndReferenceType(positionId, "PORTFOLIO_POSITION");

        if (!transactions.isEmpty() && !transactions.get(0).getUserId().equals(userId)) {
            throw new IllegalArgumentException("Position does not belong to user");
        }

        return transactions.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<TransactionDTO> getPortfolioTransactionsPaged(Long portfolioId, String userId, Pageable pageable) {
        // Get all transactions for the portfolio to calculate running totals
        List<Transaction> allTransactions = transactionRepository.findByUserIdAndPortfolioId(userId, portfolioId);

        // Sort by date and created_at ascending to calculate running totals correctly
        allTransactions.sort((a, b) -> {
            int dateCompare = a.getTransactionDate().compareTo(b.getTransactionDate());
            if (dateCompare != 0) return dateCompare;
            return a.getCreatedAt().compareTo(b.getCreatedAt());
        });

        // Calculate running quantity for each symbol and store quantity_before for each transaction
        Map<String, BigDecimal> runningQuantityBySymbol = new HashMap<>();
        Map<Long, BigDecimal> quantityBeforeByTransactionId = new HashMap<>();

        for (Transaction t : allTransactions) {
            String symbol = t.getSymbol();
            BigDecimal currentQty = runningQuantityBySymbol.getOrDefault(symbol, BigDecimal.ZERO);

            // Store the quantity BEFORE this transaction
            quantityBeforeByTransactionId.put(t.getId(), currentQty);

            // Update running quantity
            if (t.getTransactionType() == TransactionType.BUY) {
                runningQuantityBySymbol.put(symbol, currentQty.add(t.getQuantity()));
            } else if (t.getTransactionType() == TransactionType.SELL) {
                runningQuantityBySymbol.put(symbol, currentQty.subtract(t.getQuantity()));
            }
        }

        // Sort descending for display (most recent first)
        allTransactions.sort((a, b) -> {
            int dateCompare = b.getTransactionDate().compareTo(a.getTransactionDate());
            if (dateCompare != 0) return dateCompare;
            return b.getCreatedAt().compareTo(a.getCreatedAt());
        });

        // Apply pagination
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), allTransactions.size());
        List<Transaction> pagedTransactions = start < allTransactions.size()
                ? allTransactions.subList(start, end)
                : new ArrayList<>();

        // Convert to DTOs with position change percentage
        List<TransactionDTO> dtos = pagedTransactions.stream()
                .map(t -> toDTOWithPositionChange(t, quantityBeforeByTransactionId.get(t.getId())))
                .collect(Collectors.toList());

        return new PageImpl<>(dtos, pageable, allTransactions.size());
    }

    /**
     * Converts a Transaction to TransactionDTO and calculates the position change percentage.
     */
    private TransactionDTO toDTOWithPositionChange(Transaction transaction, BigDecimal quantityBefore) {
        TransactionDTO dto = toDTO(transaction);
        dto.setPositionChangePercent(calculatePositionChangePercent(
                transaction.getQuantity(), quantityBefore, transaction.getTransactionType()));
        return dto;
    }

    /**
     * Calculate the percentage change in position at the time of the transaction.
     * For first BUY: returns 100% (opens 100% of the position)
     * For subsequent BUY: (quantity / quantityBefore) * 100 = how much the position increased
     * For SELL: (quantity / quantityBefore) * 100 = how much of the position was sold
     */
    private BigDecimal calculatePositionChangePercent(BigDecimal quantity, BigDecimal quantityBefore, TransactionType type) {
        if (quantity == null || quantity.compareTo(BigDecimal.ZERO) <= 0) {
            return null;
        }

        if (type == TransactionType.BUY) {
            // For first purchase, return 100% (this transaction opens 100% of the position)
            if (quantityBefore == null || quantityBefore.compareTo(BigDecimal.ZERO) <= 0) {
                return BigDecimal.valueOf(100).setScale(2, RoundingMode.HALF_UP);
            }
            // Percentage increase = (quantity / quantityBefore) * 100
            return quantity.divide(quantityBefore, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .setScale(2, RoundingMode.HALF_UP);
        } else if (type == TransactionType.SELL) {
            // For sell, calculate what percentage of the position was sold
            if (quantityBefore == null || quantityBefore.compareTo(BigDecimal.ZERO) <= 0) {
                return null;
            }
            return quantity.divide(quantityBefore, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .setScale(2, RoundingMode.HALF_UP);
        }

        return null;
    }

    @Transactional(readOnly = true)
    public TransactionSummaryDTO getUserTransactionSummary(String userId, LocalDate startDate, LocalDate endDate) {
        TransactionSummaryDTO summary = new TransactionSummaryDTO();
        summary.setUserId(userId);
        summary.setStartDate(startDate);
        summary.setEndDate(endDate);

        // Calculate totals
        BigDecimal totalBuyAmount = transactionRepository.calculateTotalAmountByUserAndType(userId, TransactionType.BUY);
        BigDecimal totalSellAmount = transactionRepository.calculateTotalAmountByUserAndType(userId, TransactionType.SELL);
        BigDecimal totalFees = transactionRepository.calculateTotalFeesByUserAndDateRange(userId, startDate, endDate);

        summary.setTotalBuyAmount(totalBuyAmount != null ? totalBuyAmount : BigDecimal.ZERO);
        summary.setTotalSellAmount(totalSellAmount != null ? totalSellAmount : BigDecimal.ZERO);
        summary.setTotalFees(totalFees != null ? totalFees : BigDecimal.ZERO);

        // Calculate net gain/loss
        summary.setNetGainLoss(summary.getTotalSellAmount().subtract(summary.getTotalBuyAmount()).subtract(summary.getTotalFees()));

        // Count by category
        for (TransactionCategory category : TransactionCategory.values()) {
            long count = transactionRepository.countByUserIdAndCategory(userId, category);
            if (count > 0) {
                summary.addCategoryCount(category, count);
            }
        }

        return summary;
    }

    @Transactional(readOnly = true)
    public List<String> getUserSymbols(String userId, TransactionCategory category) {
        return transactionRepository.findDistinctSymbolsByUserIdAndCategory(userId, category);
    }

    public void deleteTransaction(Long id, String userId) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found with id: " + id));
        
        if (!transaction.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Transaction does not belong to user");
        }
        
        // Note: Deleting transactions will require recalculating position average cost
        // This should be handled carefully in production
        transactionRepository.delete(transaction);
    }

    private TransactionDTO toDTO(Transaction transaction) {
        TransactionDTO dto = new TransactionDTO();
        dto.setId(transaction.getId());
        dto.setUuid(transaction.getUuid());
        dto.setUserId(transaction.getUserId());
        dto.setTransactionCategory(transaction.getTransactionCategory());
        dto.setTransactionType(transaction.getTransactionType());
        dto.setReferenceId(transaction.getReferenceId());
        dto.setReferenceType(transaction.getReferenceType());
        dto.setSymbol(transaction.getSymbol());
        dto.setQuantity(transaction.getQuantity());
        dto.setPricePerUnit(transaction.getPricePerUnit());
        dto.setTotalAmount(transaction.getTotalAmount());
        dto.setFees(transaction.getFees());
        dto.setNetAmount(transaction.calculateNetAmount());
        dto.setTransactionDate(transaction.getTransactionDate());
        dto.setNotes(transaction.getNotes());
        dto.setCreatedAt(transaction.getCreatedAt());
        return dto;
    }
}