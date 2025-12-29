package com.basis.api.features.investment.portfolio;

import com.basis.api.features.investment.portfolio.dto.StockGroupDTO;
import com.basis.api.features.investment.portfolio.dto.StockGroupPositionDTO;
import com.basis.api.features.investment.position.PortfolioPosition;
import com.basis.api.features.investment.position.PortfolioPositionRepository;
import com.basis.api.features.investment.position.PositionStatus;
import com.basis.api.features.stock.master.StockMaster;
import com.basis.api.shared.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.*;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PositionAggregationServiceTest {

    @Mock
    private PortfolioRepository portfolioRepository;

    @Mock
    private PortfolioPositionRepository positionRepository;

    @InjectMocks
    private PositionAggregationService aggregationService;

    private String userId;
    private Portfolio testPortfolio;
    private UUID portfolioUuid;
    private StockMaster appleStock;
    private StockMaster googleStock;
    private List<PortfolioPosition> testPositions;

    @BeforeEach
    void setUp() {
        userId = "test-user-123";
        portfolioUuid = UUID.randomUUID();
        
        testPortfolio = new Portfolio(userId, "Test Portfolio", "Test Description");
        testPortfolio.setId(1L);
        testPortfolio.setUuid(portfolioUuid);

        // Setup stocks
        appleStock = new StockMaster();
        appleStock.setId(1L);
        appleStock.setSymbol("AAPL");
        appleStock.setCompanyName("Apple Inc.");
        appleStock.setCurrentPrice(BigDecimal.valueOf(150.00));

        googleStock = new StockMaster();
        googleStock.setId(2L);
        googleStock.setSymbol("GOOGL");
        googleStock.setCompanyName("Alphabet Inc.");
        googleStock.setCurrentPrice(BigDecimal.valueOf(2500.00));

        // Create test positions
        PortfolioPosition position1 = createPosition(1L, appleStock, 10, 140.00, 
                PositionStatus.ACTIVE, ZonedDateTime.now().minusDays(30));
        
        PortfolioPosition position2 = createPosition(2L, appleStock, 5, 145.00, 
                PositionStatus.ACTIVE, ZonedDateTime.now().minusDays(15));
        
        PortfolioPosition position3 = createPosition(3L, appleStock, 3, 142.00, 
                PositionStatus.CLOSED, ZonedDateTime.now().minusDays(60));
        
        PortfolioPosition position4 = createPosition(4L, googleStock, 2, 2400.00, 
                PositionStatus.ACTIVE, ZonedDateTime.now().minusDays(10));

        testPositions = Arrays.asList(position1, position2, position3, position4);
    }

    private PortfolioPosition createPosition(Long id, StockMaster stock, int quantity, 
                                           double price, PositionStatus status, ZonedDateTime createdAt) {
        PortfolioPosition position = new PortfolioPosition();
        position.setId(id);
        position.setUuid(UUID.randomUUID());
        position.setPortfolio(testPortfolio);
        position.setStock(stock);
        position.setQuantity(BigDecimal.valueOf(quantity));
        position.setAverageCostBasis(BigDecimal.valueOf(price));
        position.setStatus(status);
        position.setCreatedAt(createdAt);
        position.setUpdatedAt(createdAt);
        return position;
    }

    @Test
    void getStockGroups_ShouldReturnGroupedPositions() {
        // Arrange
        when(portfolioRepository.findByUuidAndUserId(portfolioUuid, userId))
                .thenReturn(Optional.of(testPortfolio));
        when(positionRepository.findByPortfolioIdAndPortfolioUserId(1L, userId))
                .thenReturn(testPositions);

        // Act
        List<StockGroupDTO> result = aggregationService.getStockGroups(portfolioUuid, userId);

        // Assert
        assertThat(result).hasSize(2); // AAPL and GOOGL groups
        
        // Verify AAPL group
        StockGroupDTO appleGroup = result.stream()
                .filter(g -> g.getSymbol().equals("AAPL"))
                .findFirst()
                .orElseThrow();
        
        assertThat(appleGroup.getCompanyName()).isEqualTo("Apple Inc.");
        assertThat(appleGroup.getCurrentPrice()).isEqualByComparingTo("150.00");
        assertThat(appleGroup.getTotalQuantity()).isEqualTo(18); // 10 + 5 + 3
        assertThat(appleGroup.getActiveQuantity()).isEqualTo(15); // 10 + 5
        assertThat(appleGroup.getSoldQuantity()).isEqualTo(3);
        assertThat(appleGroup.getPositionCount()).isEqualTo(3);
        assertThat(appleGroup.getPositions()).hasSize(3);
        
        // Verify weighted average price: (10*140 + 5*145 + 3*142) / 18 ≈ 141.72
        // The exact value depends on BigDecimal division rounding
        assertThat(appleGroup.getWeightedAveragePrice()).isCloseTo(BigDecimal.valueOf(141.72), 
                org.assertj.core.api.Assertions.within(BigDecimal.valueOf(0.20)));
        
        // Verify total cost: 10*140 + 5*145 + 3*142 = 2551
        assertThat(appleGroup.getTotalCost()).isEqualByComparingTo("2551");
        
        // Verify current value: 18 * 150 = 2700
        assertThat(appleGroup.getTotalCurrentValue()).isEqualByComparingTo("2700");
        
        // Verify gain/loss: 2700 - 2551 = 149
        assertThat(appleGroup.getTotalGainLoss()).isEqualByComparingTo("149");

        // Verify GOOGL group
        StockGroupDTO googleGroup = result.stream()
                .filter(g -> g.getSymbol().equals("GOOGL"))
                .findFirst()
                .orElseThrow();
        
        assertThat(googleGroup.getTotalQuantity()).isEqualTo(2);
        assertThat(googleGroup.getActiveQuantity()).isEqualTo(2);
        assertThat(googleGroup.getSoldQuantity()).isEqualTo(0);

        verify(portfolioRepository).findByUuidAndUserId(portfolioUuid, userId);
        verify(positionRepository).findByPortfolioIdAndPortfolioUserId(1L, userId);
    }

    @Test
    void getStockGroups_EmptyPortfolio_ShouldReturnEmptyList() {
        // Arrange
        when(portfolioRepository.findByUuidAndUserId(portfolioUuid, userId))
                .thenReturn(Optional.of(testPortfolio));
        when(positionRepository.findByPortfolioIdAndPortfolioUserId(1L, userId))
                .thenReturn(Collections.emptyList());

        // Act
        List<StockGroupDTO> result = aggregationService.getStockGroups(portfolioUuid, userId);

        // Assert
        assertThat(result).isEmpty();
    }

    @Test
    void getStockGroups_PortfolioNotFound_ShouldThrowResourceNotFoundException() {
        // Arrange
        when(portfolioRepository.findByUuidAndUserId(portfolioUuid, userId))
                .thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> aggregationService.getStockGroups(portfolioUuid, userId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Portfolio not found with uuid: " + portfolioUuid);

        verify(positionRepository, never()).findByPortfolioIdAndPortfolioUserId(anyLong(), anyString());
    }

    @Test
    void getStockGroup_SpecificSymbol_ShouldReturnSingleStockGroup() {
        // Arrange
        List<PortfolioPosition> applePositions = testPositions.stream()
                .filter(p -> p.getStock().getSymbol().equals("AAPL"))
                .collect(Collectors.toList());
        
        when(portfolioRepository.findByUuidAndUserId(portfolioUuid, userId))
                .thenReturn(Optional.of(testPortfolio));
        when(positionRepository.findByPortfolioIdAndPortfolioUserIdAndStockSymbol(1L, userId, "AAPL"))
                .thenReturn(applePositions);

        // Act
        StockGroupDTO result = aggregationService.getStockGroup(portfolioUuid, "AAPL", userId);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getSymbol()).isEqualTo("AAPL");
        assertThat(result.getTotalQuantity()).isEqualTo(18);
        assertThat(result.getPositions()).hasSize(3);
        assertThat(result.getFirstPurchaseDate()).isNotNull();
        assertThat(result.getLastPurchaseDate()).isNotNull();
        assertThat(result.getFirstPurchaseDate()).isBefore(result.getLastPurchaseDate());

        verify(positionRepository).findByPortfolioIdAndPortfolioUserIdAndStockSymbol(1L, userId, "AAPL");
    }

    @Test
    void getStockGroup_NoPositionsForSymbol_ShouldThrowResourceNotFoundException() {
        // Arrange
        when(portfolioRepository.findByUuidAndUserId(portfolioUuid, userId))
                .thenReturn(Optional.of(testPortfolio));
        when(positionRepository.findByPortfolioIdAndPortfolioUserIdAndStockSymbol(1L, userId, "TSLA"))
                .thenReturn(Collections.emptyList());

        // Act & Assert
        assertThatThrownBy(() -> aggregationService.getStockGroup(portfolioUuid, "TSLA", userId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("No positions found for stock symbol: TSLA");
    }

    @Test
    void getStockGroupsFiltered_WithSearchTerm_ShouldFilterResults() {
        // Arrange
        when(portfolioRepository.findByUuidAndUserId(portfolioUuid, userId))
                .thenReturn(Optional.of(testPortfolio));
        when(positionRepository.findByPortfolioIdAndPortfolioUserId(1L, userId))
                .thenReturn(testPositions);

        // Act
        List<StockGroupDTO> result = aggregationService.getStockGroupsFiltered(
                portfolioUuid, userId, "Apple", null, null);

        // Assert
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getSymbol()).isEqualTo("AAPL");
        assertThat(result.get(0).getCompanyName()).isEqualTo("Apple Inc.");
    }

    @Test
    void getStockGroupsFiltered_WithSorting_ShouldSortCorrectly() {
        // Arrange
        when(portfolioRepository.findByUuidAndUserId(portfolioUuid, userId))
                .thenReturn(Optional.of(testPortfolio));
        when(positionRepository.findByPortfolioIdAndPortfolioUserId(1L, userId))
                .thenReturn(testPositions);

        // Act - Sort by value descending
        List<StockGroupDTO> result = aggregationService.getStockGroupsFiltered(
                portfolioUuid, userId, null, "value", "desc");

        // Assert
        assertThat(result).hasSize(2);
        // GOOGL should be first (2 * 2500 = 5000) vs AAPL (18 * 150 = 2700)
        assertThat(result.get(0).getSymbol()).isEqualTo("GOOGL");
        assertThat(result.get(1).getSymbol()).isEqualTo("AAPL");
    }

    @Test
    void getStockGroupsFiltered_SortByGainLoss_ShouldSortCorrectly() {
        // Arrange
        when(portfolioRepository.findByUuidAndUserId(portfolioUuid, userId))
                .thenReturn(Optional.of(testPortfolio));
        when(positionRepository.findByPortfolioIdAndPortfolioUserId(1L, userId))
                .thenReturn(testPositions);

        // Act
        List<StockGroupDTO> result = aggregationService.getStockGroupsFiltered(
                portfolioUuid, userId, null, "gainloss", "desc");

        // Assert
        assertThat(result).hasSize(2);
        // GOOGL gain: 2*2500 - 2*2400 = 200
        // AAPL gain: 18*150 - 2551 = 149
        assertThat(result.get(0).getSymbol()).isEqualTo("GOOGL");
        assertThat(result.get(1).getSymbol()).isEqualTo("AAPL");
    }

    @Test
    void createStockGroup_WithNullCurrentPrice_ShouldHandleGracefully() {
        // Arrange - Stock with null current price
        appleStock.setCurrentPrice(null);
        PortfolioPosition position = createPosition(5L, appleStock, 10, 100.00, 
                PositionStatus.ACTIVE, ZonedDateTime.now());
        
        when(portfolioRepository.findByUuidAndUserId(portfolioUuid, userId))
                .thenReturn(Optional.of(testPortfolio));
        when(positionRepository.findByPortfolioIdAndPortfolioUserId(1L, userId))
                .thenReturn(Arrays.asList(position));

        // Act
        List<StockGroupDTO> result = aggregationService.getStockGroups(portfolioUuid, userId);

        // Assert
        assertThat(result).hasSize(1);
        StockGroupDTO stockGroup = result.get(0);
        assertThat(stockGroup.getCurrentPrice()).isEqualByComparingTo("0"); // getCurrentPriceSafe returns 0
        assertThat(stockGroup.getTotalCurrentValue()).isEqualByComparingTo("0");
        assertThat(stockGroup.getTotalGainLoss()).isEqualByComparingTo("-1000"); // 0 - 1000
    }

    @Test
    void stockGroupPositions_ShouldBeSortedByCreationDate() {
        // Arrange
        when(portfolioRepository.findByUuidAndUserId(portfolioUuid, userId))
                .thenReturn(Optional.of(testPortfolio));
        when(positionRepository.findByPortfolioIdAndPortfolioUserId(1L, userId))
                .thenReturn(testPositions);

        // Act
        List<StockGroupDTO> result = aggregationService.getStockGroups(portfolioUuid, userId);
        
        // Assert - Check AAPL positions are sorted by creation date (FIFO)
        StockGroupDTO appleGroup = result.stream()
                .filter(g -> g.getSymbol().equals("AAPL"))
                .findFirst()
                .orElseThrow();
        
        List<StockGroupPositionDTO> positions = appleGroup.getPositions();
        assertThat(positions).hasSize(3);
        
        // Verify positions are sorted by purchase date (oldest first)
        for (int i = 0; i < positions.size() - 1; i++) {
            assertThat(positions.get(i).getPurchaseDate())
                    .isBefore(positions.get(i + 1).getPurchaseDate());
        }
    }

    @Test
    void positionDTO_ShouldCalculateIndividualGainLoss() {
        // Arrange
        when(portfolioRepository.findByUuidAndUserId(portfolioUuid, userId))
                .thenReturn(Optional.of(testPortfolio));
        when(positionRepository.findByPortfolioIdAndPortfolioUserId(1L, userId))
                .thenReturn(Arrays.asList(testPositions.get(0))); // Single AAPL position

        // Act
        List<StockGroupDTO> result = aggregationService.getStockGroups(portfolioUuid, userId);

        // Assert
        StockGroupPositionDTO positionDTO = result.get(0).getPositions().get(0);
        
        // Position: 10 shares at $140, current price $150
        assertThat(positionDTO.getTotalCost()).isEqualByComparingTo("1400");
        assertThat(positionDTO.getCurrentValue()).isEqualByComparingTo("1500");
        assertThat(positionDTO.getGainLoss()).isEqualByComparingTo("100");
        assertThat(positionDTO.getGainLossPercentage()).isCloseTo(BigDecimal.valueOf(7.14), 
                org.assertj.core.api.Assertions.within(BigDecimal.valueOf(0.01)));
    }
}