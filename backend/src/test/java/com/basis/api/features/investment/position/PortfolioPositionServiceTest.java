package com.basis.api.features.investment.position;

import com.basis.api.features.investment.portfolio.Portfolio;
import com.basis.api.features.investment.portfolio.PortfolioRepository;
import com.basis.api.features.investment.position.dto.BuyPositionRequest;
import com.basis.api.features.investment.position.dto.PortfolioPositionDTO;
import com.basis.api.features.investment.position.dto.SellPositionRequest;
import com.basis.api.features.stock.master.StockMaster;
import com.basis.api.features.stock.master.StockMasterService;
import com.basis.api.features.transaction.Transaction;
import com.basis.api.features.transaction.TransactionRepository;
import com.basis.api.features.transaction.TransactionType;
import com.basis.api.shared.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PortfolioPositionServiceTest {

    @Mock
    private PortfolioPositionRepository positionRepository;

    @Mock
    private PortfolioRepository portfolioRepository;

    @Mock
    private StockMasterService stockMasterService;

    @Mock
    private TransactionRepository transactionRepository;

    @InjectMocks
    private PortfolioPositionService positionService;

    private String userId;
    private Portfolio testPortfolio;
    private StockMaster testStock;
    private PortfolioPosition testPosition;
    private BuyPositionRequest buyRequest;
    private SellPositionRequest sellRequest;

    @BeforeEach
    void setUp() {
        userId = "test-user-123";
        
        // Setup portfolio
        testPortfolio = new Portfolio(userId, "Test Portfolio", "Test Description");
        testPortfolio.setId(1L);
        testPortfolio.setUuid(UUID.randomUUID());

        // Setup stock
        testStock = new StockMaster();
        testStock.setId(1L);
        testStock.setSymbol("AAPL");
        testStock.setCompanyName("Apple Inc.");
        testStock.setExchange("NASDAQ");
        testStock.setSector("Technology");

        // Setup position
        testPosition = new PortfolioPosition(testPortfolio, testStock);
        testPosition.setId(1L);
        testPosition.setUuid(UUID.randomUUID());
        testPosition.setQuantity(BigDecimal.valueOf(10));
        testPosition.setAverageCostBasis(BigDecimal.valueOf(150.00));
        testPosition.setStatus(PositionStatus.ACTIVE);

        // Setup buy request
        buyRequest = new BuyPositionRequest();
        buyRequest.setStockSymbol("AAPL");
        buyRequest.setCompanyName("Apple Inc.");
        buyRequest.setQuantity(BigDecimal.valueOf(5));
        buyRequest.setPricePerShare(BigDecimal.valueOf(155.00));
        buyRequest.setTransactionDate(LocalDate.now());
        buyRequest.setNotes("Test buy");

        // Setup sell request
        sellRequest = new SellPositionRequest();
        sellRequest.setPositionId(1L);
        sellRequest.setQuantity(BigDecimal.valueOf(3));
        sellRequest.setPricePerShare(BigDecimal.valueOf(160.00));
        sellRequest.setTransactionDate(LocalDate.now());
        sellRequest.setNotes("Test sell");
    }

    @Test
    void buyStock_NewPosition_ShouldCreateNewPositionAndTransaction() {
        // Arrange
        when(portfolioRepository.findById(1L)).thenReturn(Optional.of(testPortfolio));
        when(stockMasterService.findOrCreateStock("AAPL", "Apple Inc.")).thenReturn(testStock);
        when(positionRepository.findByPortfolioIdAndStockId(1L, 1L)).thenReturn(Optional.empty());
        when(positionRepository.save(any(PortfolioPosition.class))).thenAnswer(invocation -> {
            PortfolioPosition position = invocation.getArgument(0);
            position.setId(2L);
            return position;
        });

        // Act
        PortfolioPositionDTO result = positionService.buyStock(1L, userId, buyRequest);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getStock().getSymbol()).isEqualTo("AAPL");
        assertThat(result.getQuantity()).isEqualByComparingTo("5");

        // Verify position creation
        ArgumentCaptor<PortfolioPosition> positionCaptor = ArgumentCaptor.forClass(PortfolioPosition.class);
        verify(positionRepository, times(2)).save(positionCaptor.capture());
        List<PortfolioPosition> savedPositions = positionCaptor.getAllValues();
        assertThat(savedPositions.get(0).getPortfolio()).isEqualTo(testPortfolio);
        assertThat(savedPositions.get(0).getStock()).isEqualTo(testStock);

        // Verify transaction creation
        ArgumentCaptor<Transaction> transactionCaptor = ArgumentCaptor.forClass(Transaction.class);
        verify(transactionRepository).save(transactionCaptor.capture());
        Transaction savedTransaction = transactionCaptor.getValue();
        assertThat(savedTransaction.getUserId()).isEqualTo(userId);
        assertThat(savedTransaction.getTransactionType()).isEqualTo(TransactionType.BUY);
        assertThat(savedTransaction.getSymbol()).isEqualTo("AAPL");
        assertThat(savedTransaction.getQuantity()).isEqualByComparingTo("5");
        assertThat(savedTransaction.getPricePerUnit()).isEqualByComparingTo("155.00");
    }

    @Test
    void buyStock_ExistingPosition_ShouldAddSharesToExistingPosition() {
        // Arrange
        when(portfolioRepository.findById(1L)).thenReturn(Optional.of(testPortfolio));
        when(stockMasterService.findOrCreateStock("AAPL", "Apple Inc.")).thenReturn(testStock);
        when(positionRepository.findByPortfolioIdAndStockId(1L, 1L)).thenReturn(Optional.of(testPosition));
        when(positionRepository.save(any(PortfolioPosition.class))).thenReturn(testPosition);

        // Act
        PortfolioPositionDTO result = positionService.buyStock(1L, userId, buyRequest);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getStock().getSymbol()).isEqualTo("AAPL");

        // Verify position was updated with correct values
        ArgumentCaptor<PortfolioPosition> positionCaptor = ArgumentCaptor.forClass(PortfolioPosition.class);
        verify(positionRepository).save(positionCaptor.capture());
        
        PortfolioPosition savedPosition = positionCaptor.getValue();
        assertThat(savedPosition.getQuantity()).isEqualByComparingTo(BigDecimal.valueOf(15)); // 10 + 5
        
        // Verify transaction creation
        verify(transactionRepository).save(any(Transaction.class));
    }

    @Test
    void buyStock_WrongUser_ShouldThrowIllegalArgumentException() {
        // Arrange
        when(portfolioRepository.findById(1L)).thenReturn(Optional.of(testPortfolio));

        // Act & Assert
        assertThatThrownBy(() -> positionService.buyStock(1L, "wrong-user", buyRequest))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Portfolio does not belong to user");

        verify(stockMasterService, never()).findOrCreateStock(anyString(), anyString());
        verify(positionRepository, never()).save(any());
    }

    @Test
    void buyStock_PortfolioNotFound_ShouldThrowResourceNotFoundException() {
        // Arrange
        when(portfolioRepository.findById(1L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> positionService.buyStock(1L, userId, buyRequest))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Portfolio not found with id: 1");
    }

    @Test
    void sellStock_PartialSell_ShouldReduceSharesAndCreateTransaction() {
        // Arrange
        when(positionRepository.findById(1L)).thenReturn(Optional.of(testPosition));
        when(positionRepository.save(any(PortfolioPosition.class))).thenReturn(testPosition);

        // Act
        PortfolioPositionDTO result = positionService.sellStock(userId, sellRequest);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getStock().getSymbol()).isEqualTo("AAPL");

        // Verify position was updated with correct values
        ArgumentCaptor<PortfolioPosition> positionCaptor = ArgumentCaptor.forClass(PortfolioPosition.class);
        verify(positionRepository).save(positionCaptor.capture());
        
        PortfolioPosition savedPosition = positionCaptor.getValue();
        assertThat(savedPosition.getQuantity()).isEqualByComparingTo(BigDecimal.valueOf(7)); // 10 - 3

        // Verify transaction creation
        ArgumentCaptor<Transaction> transactionCaptor = ArgumentCaptor.forClass(Transaction.class);
        verify(transactionRepository).save(transactionCaptor.capture());
        Transaction savedTransaction = transactionCaptor.getValue();
        assertThat(savedTransaction.getTransactionType()).isEqualTo(TransactionType.SELL);
        assertThat(savedTransaction.getQuantity()).isEqualByComparingTo("3");
        assertThat(savedTransaction.getPricePerUnit()).isEqualByComparingTo("160.00");
    }

    @Test
    void sellStock_WrongUser_ShouldThrowIllegalArgumentException() {
        // Arrange
        Portfolio wrongUserPortfolio = new Portfolio("wrong-user", "Wrong Portfolio", "Description");
        wrongUserPortfolio.setId(2L);
        PortfolioPosition wrongUserPosition = new PortfolioPosition(wrongUserPortfolio, testStock);
        wrongUserPosition.setId(2L);
        
        when(positionRepository.findById(2L)).thenReturn(Optional.of(wrongUserPosition));
        sellRequest.setPositionId(2L);

        // Act & Assert
        assertThatThrownBy(() -> positionService.sellStock(userId, sellRequest))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Position does not belong to user");

        verify(positionRepository, never()).save(any());
    }

    @Test
    void sellStock_PositionNotFound_ShouldThrowResourceNotFoundException() {
        // Arrange
        when(positionRepository.findById(1L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> positionService.sellStock(userId, sellRequest))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Position not found with id: 1");
    }

    @Test
    void getPosition_ValidRequest_ShouldReturnPosition() {
        // Arrange
        when(positionRepository.findById(1L)).thenReturn(Optional.of(testPosition));

        // Act
        PortfolioPositionDTO result = positionService.getPosition(1L, userId);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getStock().getSymbol()).isEqualTo("AAPL");
        assertThat(result.getQuantity()).isEqualByComparingTo("10");
    }

    @Test
    void getPositionByUuid_ValidRequest_ShouldReturnPosition() {
        // Arrange
        UUID uuid = testPosition.getUuid();
        when(positionRepository.findByUuid(uuid)).thenReturn(Optional.of(testPosition));

        // Act
        PortfolioPositionDTO result = positionService.getPositionByUuid(uuid, userId);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getUuid()).isEqualTo(uuid);
        assertThat(result.getStock().getSymbol()).isEqualTo("AAPL");
    }

    @Test
    void getPortfolioPositions_ShouldReturnAllPositionsForPortfolio() {
        // Arrange
        PortfolioPosition position2 = new PortfolioPosition(testPortfolio, testStock);
        position2.setId(2L);
        position2.setQuantity(BigDecimal.valueOf(20));
        
        when(portfolioRepository.findById(1L)).thenReturn(Optional.of(testPortfolio));
        when(positionRepository.findByPortfolioId(1L)).thenReturn(Arrays.asList(testPosition, position2));

        // Act
        List<PortfolioPositionDTO> result = positionService.getPortfolioPositions(1L, userId);

        // Assert
        assertThat(result).hasSize(2);
        assertThat(result.get(0).getId()).isEqualTo(1L);
        assertThat(result.get(1).getId()).isEqualTo(2L);
    }

    @Test
    void getActivePortfolioPositions_ShouldReturnOnlyActivePositions() {
        // Arrange
        PortfolioPosition closedPosition = new PortfolioPosition(testPortfolio, testStock);
        closedPosition.setId(2L);
        closedPosition.setStatus(PositionStatus.CLOSED);
        
        when(portfolioRepository.findById(1L)).thenReturn(Optional.of(testPortfolio));
        when(positionRepository.findByPortfolioIdAndStatus(1L, PositionStatus.ACTIVE))
                .thenReturn(Arrays.asList(testPosition)); // Only active position

        // Act
        List<PortfolioPositionDTO> result = positionService.getActivePortfolioPositions(1L, userId);

        // Assert
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getId()).isEqualTo(1L);
        assertThat(result.get(0).getStatus()).isEqualTo(PositionStatus.ACTIVE);
    }

    @Test
    void getUserPositions_ShouldReturnAllUserPositions() {
        // Arrange
        when(positionRepository.findByUserId(userId)).thenReturn(Arrays.asList(testPosition));

        // Act
        List<PortfolioPositionDTO> result = positionService.getUserPositions(userId);

        // Assert
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getId()).isEqualTo(1L);
    }

    @Test
    void calculatePortfolioTotalValue_ShouldReturnTotalValue() {
        // Arrange
        when(portfolioRepository.findById(1L)).thenReturn(Optional.of(testPortfolio));
        when(positionRepository.calculateTotalInvestmentValue(1L)).thenReturn(BigDecimal.valueOf(5000.00));

        // Act
        BigDecimal result = positionService.calculatePortfolioTotalValue(1L, userId);

        // Assert
        assertThat(result).isEqualByComparingTo("5000.00");
    }

    @Test
    void calculatePortfolioTotalValue_NoPositions_ShouldReturnZero() {
        // Arrange
        when(portfolioRepository.findById(1L)).thenReturn(Optional.of(testPortfolio));
        when(positionRepository.calculateTotalInvestmentValue(1L)).thenReturn(null);

        // Act
        BigDecimal result = positionService.calculatePortfolioTotalValue(1L, userId);

        // Assert
        assertThat(result).isEqualByComparingTo("0");
    }

    @Test
    void deletePosition_ValidRequest_ShouldDeletePosition() {
        // Arrange
        when(positionRepository.findById(1L)).thenReturn(Optional.of(testPosition));

        // Act
        positionService.deletePosition(1L, userId);

        // Assert
        verify(positionRepository).delete(any(PortfolioPosition.class));
    }

    @Test
    void deletePosition_WrongUser_ShouldThrowIllegalArgumentException() {
        // Arrange
        when(positionRepository.findById(1L)).thenReturn(Optional.of(testPosition));

        // Act & Assert
        assertThatThrownBy(() -> positionService.deletePosition(1L, "wrong-user"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Position does not belong to user");

        verify(positionRepository, never()).delete(any());
    }

    @Test
    void deletePositionByUuid_ValidRequest_ShouldDeletePosition() {
        // Arrange
        UUID uuid = testPosition.getUuid();
        when(positionRepository.findByUuid(uuid)).thenReturn(Optional.of(testPosition));

        // Act
        positionService.deletePositionByUuid(uuid, userId);

        // Assert
        verify(positionRepository).delete(any(PortfolioPosition.class));
    }

    @Test
    void deletePositionByUuid_NotFound_ShouldThrowResourceNotFoundException() {
        // Arrange
        UUID uuid = UUID.randomUUID();
        when(positionRepository.findByUuid(uuid)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> positionService.deletePositionByUuid(uuid, userId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Position not found with uuid: " + uuid);
    }
}