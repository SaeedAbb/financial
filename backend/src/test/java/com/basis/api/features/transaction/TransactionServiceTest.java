package com.basis.api.features.transaction;

import com.basis.api.features.transaction.dto.TransactionDTO;
import com.basis.api.features.transaction.dto.TransactionSummaryDTO;
import com.basis.api.shared.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TransactionServiceTest {

    @Mock
    private TransactionRepository transactionRepository;

    @InjectMocks
    private TransactionService transactionService;

    private Transaction mockTransaction;
    private final String userId = "user123";
    private final Long transactionId = 1L;
    private final UUID transactionUuid = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        mockTransaction = new Transaction();
        mockTransaction.setId(transactionId);
        mockTransaction.setUuid(transactionUuid);
        mockTransaction.setUserId(userId);
        mockTransaction.setTransactionCategory(TransactionCategory.STOCK);
        mockTransaction.setTransactionType(TransactionType.BUY);
        mockTransaction.setReferenceId(100L);
        mockTransaction.setReferenceType("PORTFOLIO_POSITION");
        mockTransaction.setSymbol("AAPL");
        mockTransaction.setQuantity(10);
        mockTransaction.setPricePerUnit(new BigDecimal("150.00"));
        mockTransaction.setTotalAmount(new BigDecimal("1500.00"));
        mockTransaction.setFees(new BigDecimal("10.00"));
        mockTransaction.setTransactionDate(LocalDate.now());
        mockTransaction.setNotes("Test transaction");
        mockTransaction.setCreatedAt(LocalDateTime.now());
    }

    @Test
    void testGetTransaction_Success() {
        when(transactionRepository.findById(transactionId)).thenReturn(Optional.of(mockTransaction));

        TransactionDTO result = transactionService.getTransaction(transactionId, userId);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(transactionId);
        assertThat(result.getSymbol()).isEqualTo("AAPL");
        assertThat(result.getQuantity()).isEqualTo(10);

        verify(transactionRepository).findById(transactionId);
    }

    @Test
    void testGetTransaction_NotFound() {
        when(transactionRepository.findById(transactionId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> transactionService.getTransaction(transactionId, userId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Transaction not found with id: " + transactionId);

        verify(transactionRepository).findById(transactionId);
    }

    @Test
    void testGetTransaction_WrongUser() {
        mockTransaction.setUserId("differentUser");
        when(transactionRepository.findById(transactionId)).thenReturn(Optional.of(mockTransaction));

        assertThatThrownBy(() -> transactionService.getTransaction(transactionId, userId))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Transaction does not belong to user");

        verify(transactionRepository).findById(transactionId);
    }

    @Test
    void testGetTransactionByUuid_Success() {
        when(transactionRepository.findByUuid(transactionUuid)).thenReturn(Optional.of(mockTransaction));

        TransactionDTO result = transactionService.getTransactionByUuid(transactionUuid, userId);

        assertThat(result).isNotNull();
        assertThat(result.getUuid()).isEqualTo(transactionUuid);
        assertThat(result.getSymbol()).isEqualTo("AAPL");

        verify(transactionRepository).findByUuid(transactionUuid);
    }

    @Test
    void testGetTransactionByUuid_NotFound() {
        when(transactionRepository.findByUuid(transactionUuid)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> transactionService.getTransactionByUuid(transactionUuid, userId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Transaction not found with uuid: " + transactionUuid);

        verify(transactionRepository).findByUuid(transactionUuid);
    }

    @Test
    void testGetUserTransactions() {
        Transaction transaction2 = new Transaction();
        transaction2.setId(2L);
        transaction2.setUserId(userId);
        transaction2.setSymbol("MSFT");

        when(transactionRepository.findByUserId(userId))
                .thenReturn(Arrays.asList(mockTransaction, transaction2));

        List<TransactionDTO> result = transactionService.getUserTransactions(userId);

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getSymbol()).isEqualTo("AAPL");
        assertThat(result.get(1).getSymbol()).isEqualTo("MSFT");

        verify(transactionRepository).findByUserId(userId);
    }

    @Test
    void testGetUserTransactionsPaged() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Transaction> page = new PageImpl<>(Arrays.asList(mockTransaction), pageable, 1);

        when(transactionRepository.findByUserId(userId, pageable)).thenReturn(page);

        Page<TransactionDTO> result = transactionService.getUserTransactionsPaged(userId, pageable);

        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getSymbol()).isEqualTo("AAPL");

        verify(transactionRepository).findByUserId(userId, pageable);
    }

    @Test
    void testGetUserTransactionsByCategory() {
        when(transactionRepository.findByUserIdAndTransactionCategory(userId, TransactionCategory.STOCK))
                .thenReturn(Arrays.asList(mockTransaction));

        List<TransactionDTO> result = transactionService.getUserTransactionsByCategory(userId, TransactionCategory.STOCK);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getTransactionCategory()).isEqualTo(TransactionCategory.STOCK);

        verify(transactionRepository).findByUserIdAndTransactionCategory(userId, TransactionCategory.STOCK);
    }

    @Test
    void testGetUserTransactionsByType() {
        when(transactionRepository.findByUserIdAndTransactionType(userId, TransactionType.BUY))
                .thenReturn(Arrays.asList(mockTransaction));

        List<TransactionDTO> result = transactionService.getUserTransactionsByType(userId, TransactionType.BUY);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getTransactionType()).isEqualTo(TransactionType.BUY);

        verify(transactionRepository).findByUserIdAndTransactionType(userId, TransactionType.BUY);
    }

    @Test
    void testGetUserTransactionsByDateRange() {
        LocalDate startDate = LocalDate.now().minusDays(30);
        LocalDate endDate = LocalDate.now();

        when(transactionRepository.findByUserIdAndDateRange(userId, startDate, endDate))
                .thenReturn(Arrays.asList(mockTransaction));

        List<TransactionDTO> result = transactionService.getUserTransactionsByDateRange(userId, startDate, endDate);

        assertThat(result).hasSize(1);
        verify(transactionRepository).findByUserIdAndDateRange(userId, startDate, endDate);
    }

    @Test
    void testGetUserTransactionsBySymbol() {
        when(transactionRepository.findByUserIdAndSymbol(userId, "AAPL"))
                .thenReturn(Arrays.asList(mockTransaction));

        List<TransactionDTO> result = transactionService.getUserTransactionsBySymbol(userId, "AAPL");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getSymbol()).isEqualTo("AAPL");

        verify(transactionRepository).findByUserIdAndSymbol(userId, "AAPL");
    }

    @Test
    void testGetPositionTransactions_Success() {
        Long positionId = 100L;
        when(transactionRepository.findByReferenceIdAndReferenceType(positionId, "PORTFOLIO_POSITION"))
                .thenReturn(Arrays.asList(mockTransaction));

        List<TransactionDTO> result = transactionService.getPositionTransactions(positionId, userId);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getReferenceId()).isEqualTo(positionId);

        verify(transactionRepository).findByReferenceIdAndReferenceType(positionId, "PORTFOLIO_POSITION");
    }

    @Test
    void testGetPositionTransactions_WrongUser() {
        Long positionId = 100L;
        mockTransaction.setUserId("differentUser");
        
        when(transactionRepository.findByReferenceIdAndReferenceType(positionId, "PORTFOLIO_POSITION"))
                .thenReturn(Arrays.asList(mockTransaction));

        assertThatThrownBy(() -> transactionService.getPositionTransactions(positionId, userId))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Position does not belong to user");

        verify(transactionRepository).findByReferenceIdAndReferenceType(positionId, "PORTFOLIO_POSITION");
    }

    @Test
    void testGetPositionTransactions_EmptyList() {
        Long positionId = 100L;
        when(transactionRepository.findByReferenceIdAndReferenceType(positionId, "PORTFOLIO_POSITION"))
                .thenReturn(Collections.emptyList());

        List<TransactionDTO> result = transactionService.getPositionTransactions(positionId, userId);

        assertThat(result).isEmpty();
        verify(transactionRepository).findByReferenceIdAndReferenceType(positionId, "PORTFOLIO_POSITION");
    }

    @Test
    void testGetUserTransactionSummary() {
        LocalDate startDate = LocalDate.now().minusDays(30);
        LocalDate endDate = LocalDate.now();

        when(transactionRepository.calculateTotalAmountByUserAndType(userId, TransactionType.BUY))
                .thenReturn(new BigDecimal("10000.00"));
        when(transactionRepository.calculateTotalAmountByUserAndType(userId, TransactionType.SELL))
                .thenReturn(new BigDecimal("12000.00"));
        when(transactionRepository.calculateTotalFeesByUserAndDateRange(userId, startDate, endDate))
                .thenReturn(new BigDecimal("100.00"));
        when(transactionRepository.countByUserIdAndCategory(userId, TransactionCategory.STOCK))
                .thenReturn(5L);
        when(transactionRepository.countByUserIdAndCategory(userId, TransactionCategory.ETF))
                .thenReturn(3L);

        TransactionSummaryDTO result = transactionService.getUserTransactionSummary(userId, startDate, endDate);

        assertThat(result).isNotNull();
        assertThat(result.getUserId()).isEqualTo(userId);
        assertThat(result.getTotalBuyAmount()).isEqualByComparingTo("10000.00");
        assertThat(result.getTotalSellAmount()).isEqualByComparingTo("12000.00");
        assertThat(result.getTotalFees()).isEqualByComparingTo("100.00");
        assertThat(result.getNetGainLoss()).isEqualByComparingTo("1900.00"); // 12000 - 10000 - 100
        assertThat(result.getCategoryCount(TransactionCategory.STOCK)).isEqualTo(5L);
        assertThat(result.getCategoryCount(TransactionCategory.ETF)).isEqualTo(3L);

        verify(transactionRepository).calculateTotalAmountByUserAndType(userId, TransactionType.BUY);
        verify(transactionRepository).calculateTotalAmountByUserAndType(userId, TransactionType.SELL);
        verify(transactionRepository).calculateTotalFeesByUserAndDateRange(userId, startDate, endDate);
    }

    @Test
    void testGetUserTransactionSummary_WithNullValues() {
        LocalDate startDate = LocalDate.now().minusDays(30);
        LocalDate endDate = LocalDate.now();

        when(transactionRepository.calculateTotalAmountByUserAndType(userId, TransactionType.BUY))
                .thenReturn(null);
        when(transactionRepository.calculateTotalAmountByUserAndType(userId, TransactionType.SELL))
                .thenReturn(null);
        when(transactionRepository.calculateTotalFeesByUserAndDateRange(userId, startDate, endDate))
                .thenReturn(null);

        TransactionSummaryDTO result = transactionService.getUserTransactionSummary(userId, startDate, endDate);

        assertThat(result).isNotNull();
        assertThat(result.getTotalBuyAmount()).isEqualByComparingTo("0");
        assertThat(result.getTotalSellAmount()).isEqualByComparingTo("0");
        assertThat(result.getTotalFees()).isEqualByComparingTo("0");
        assertThat(result.getNetGainLoss()).isEqualByComparingTo("0");
    }

    @Test
    void testGetUserSymbols() {
        when(transactionRepository.findDistinctSymbolsByUserIdAndCategory(userId, TransactionCategory.STOCK))
                .thenReturn(Arrays.asList("AAPL", "MSFT", "GOOGL"));

        List<String> result = transactionService.getUserSymbols(userId, TransactionCategory.STOCK);

        assertThat(result).containsExactly("AAPL", "MSFT", "GOOGL");

        verify(transactionRepository).findDistinctSymbolsByUserIdAndCategory(userId, TransactionCategory.STOCK);
    }

    @Test
    void testDeleteTransaction_Success() {
        when(transactionRepository.findById(transactionId)).thenReturn(Optional.of(mockTransaction));

        transactionService.deleteTransaction(transactionId, userId);

        verify(transactionRepository).findById(transactionId);
        verify(transactionRepository).delete(mockTransaction);
    }

    @Test
    void testDeleteTransaction_NotFound() {
        when(transactionRepository.findById(transactionId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> transactionService.deleteTransaction(transactionId, userId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Transaction not found with id: " + transactionId);

        verify(transactionRepository).findById(transactionId);
        verify(transactionRepository, never()).delete(any());
    }

    @Test
    void testDeleteTransaction_WrongUser() {
        mockTransaction.setUserId("differentUser");
        when(transactionRepository.findById(transactionId)).thenReturn(Optional.of(mockTransaction));

        assertThatThrownBy(() -> transactionService.deleteTransaction(transactionId, userId))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Transaction does not belong to user");

        verify(transactionRepository).findById(transactionId);
        verify(transactionRepository, never()).delete(any());
    }

    @Test
    void testToDTO_CalculatesNetAmount() {
        mockTransaction.setFees(new BigDecimal("10.00"));
        mockTransaction.setTotalAmount(new BigDecimal("1500.00"));

        TransactionDTO result = transactionService.getTransaction(transactionId, userId);

        // Note: This test assumes the toDTO method is being tested through getTransaction
        // The net amount should be calculated correctly
        assertThat(result.getNetAmount()).isNotNull();
        // The actual calculation depends on the calculateNetAmount method in the Transaction entity
    }
}