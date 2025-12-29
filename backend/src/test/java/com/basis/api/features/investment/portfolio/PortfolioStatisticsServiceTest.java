package com.basis.api.features.investment.portfolio;

import com.basis.api.features.investment.portfolio.dto.PortfolioStatisticsDTO;
import com.basis.api.features.investment.portfolio.dto.PortfolioSummaryDTO;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PortfolioStatisticsServiceTest {

    @Mock
    private PortfolioRepository portfolioRepository;

    @Mock
    private PortfolioPositionRepository positionRepository;

    @InjectMocks
    private PortfolioStatisticsService statisticsService;

    private String userId;
    private Portfolio testPortfolio;
    private UUID portfolioUuid;
    private StockMaster testStock1;
    private StockMaster testStock2;
    private List<PortfolioPosition> testPositions;

    @BeforeEach
    void setUp() {
        userId = "test-user-123";
        portfolioUuid = UUID.randomUUID();
        
        testPortfolio = new Portfolio(userId, "Test Portfolio", "Test Description");
        testPortfolio.setId(1L);
        testPortfolio.setUuid(portfolioUuid);

        testStock1 = new StockMaster();
        testStock1.setId(1L);
        testStock1.setSymbol("AAPL");
        testStock1.setCompanyName("Apple Inc.");
        testStock1.setCurrentPrice(BigDecimal.valueOf(150.00));

        testStock2 = new StockMaster();
        testStock2.setId(2L);
        testStock2.setSymbol("GOOGL");
        testStock2.setCompanyName("Alphabet Inc.");
        testStock2.setCurrentPrice(BigDecimal.valueOf(2500.00));

        // Create test positions
        PortfolioPosition position1 = new PortfolioPosition();
        position1.setId(1L);
        position1.setPortfolio(testPortfolio);
        position1.setStock(testStock1);
        position1.setQuantity(BigDecimal.valueOf(10));
        position1.setAverageCostBasis(BigDecimal.valueOf(140.00)); // Total cost: 1400
        position1.setStatus(PositionStatus.ACTIVE);
        position1.setCreatedAt(ZonedDateTime.now().minusDays(30));

        PortfolioPosition position2 = new PortfolioPosition();
        position2.setId(2L);
        position2.setPortfolio(testPortfolio);
        position2.setStock(testStock2);
        position2.setQuantity(BigDecimal.valueOf(5));
        position2.setAverageCostBasis(BigDecimal.valueOf(2400.00)); // Total cost: 12000
        position2.setStatus(PositionStatus.ACTIVE);
        position2.setCreatedAt(ZonedDateTime.now().minusDays(15));

        PortfolioPosition position3 = new PortfolioPosition();
        position3.setId(3L);
        position3.setPortfolio(testPortfolio);
        position3.setStock(testStock1);
        position3.setQuantity(BigDecimal.valueOf(5));
        position3.setAverageCostBasis(BigDecimal.valueOf(135.00)); // Total cost: 675
        position3.setStatus(PositionStatus.CLOSED);
        position3.setCreatedAt(ZonedDateTime.now().minusDays(60));

        testPositions = Arrays.asList(position1, position2, position3);
    }

    @Test
    void getPortfolioStatistics_WithPositions_ShouldCalculateCorrectStatistics() {
        // Arrange
        when(portfolioRepository.findByUuidAndUserId(portfolioUuid, userId))
                .thenReturn(Optional.of(testPortfolio));
        when(positionRepository.findByPortfolioIdAndPortfolioUserId(1L, userId))
                .thenReturn(testPositions);

        // Act
        PortfolioStatisticsDTO result = statisticsService.getPortfolioStatistics(portfolioUuid, userId);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getPortfolioId()).isEqualTo(1L);
        assertThat(result.getPortfolioUuid()).isEqualTo(portfolioUuid);
        assertThat(result.getPortfolioName()).isEqualTo("Test Portfolio");

        // Total investment: 1400 + 12000 + 675 = 14075
        assertThat(result.getTotalInvestment()).isEqualByComparingTo("14075");
        
        // Current value: (10 * 150) + (5 * 2500) + (5 * 150) = 1500 + 12500 + 750 = 14750
        assertThat(result.getTotalCurrentValue()).isEqualByComparingTo("14750");
        
        // Gain/Loss: 14750 - 14075 = 675
        assertThat(result.getTotalGainLoss()).isEqualByComparingTo("675");
        
        // Gain/Loss %: (675 / 14075) * 100 ≈ 4.795%
        assertThat(result.getGainLossPercentage()).isCloseTo(BigDecimal.valueOf(4.795), 
                org.assertj.core.api.Assertions.within(BigDecimal.valueOf(0.01)));

        assertThat(result.getActivePositionsCount()).isEqualTo(2);
        assertThat(result.getClosedPositionsCount()).isEqualTo(1);
        assertThat(result.getTotalPositionsCount()).isEqualTo(3);
        assertThat(result.getDistinctStocksCount()).isEqualTo(2); // AAPL and GOOGL

        assertThat(result.getOldestPositionDate()).isNotNull();
        assertThat(result.getNewestPositionDate()).isNotNull();
        assertThat(result.getOldestPositionDate()).isBefore(result.getNewestPositionDate());

        verify(portfolioRepository).findByUuidAndUserId(portfolioUuid, userId);
        verify(positionRepository).findByPortfolioIdAndPortfolioUserId(1L, userId);
    }

    @Test
    void getPortfolioStatistics_EmptyPortfolio_ShouldReturnZeroStatistics() {
        // Arrange
        when(portfolioRepository.findByUuidAndUserId(portfolioUuid, userId))
                .thenReturn(Optional.of(testPortfolio));
        when(positionRepository.findByPortfolioIdAndPortfolioUserId(1L, userId))
                .thenReturn(Collections.emptyList());

        // Act
        PortfolioStatisticsDTO result = statisticsService.getPortfolioStatistics(portfolioUuid, userId);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getTotalInvestment()).isEqualByComparingTo("0");
        assertThat(result.getTotalCurrentValue()).isEqualByComparingTo("0");
        assertThat(result.getTotalGainLoss()).isEqualByComparingTo("0");
        assertThat(result.getGainLossPercentage()).isEqualByComparingTo("0");
        assertThat(result.getActivePositionsCount()).isEqualTo(0);
        assertThat(result.getClosedPositionsCount()).isEqualTo(0);
        assertThat(result.getTotalPositionsCount()).isEqualTo(0);
        assertThat(result.getDistinctStocksCount()).isEqualTo(0);
    }

    @Test
    void getPortfolioStatistics_PortfolioNotFound_ShouldThrowResourceNotFoundException() {
        // Arrange
        when(portfolioRepository.findByUuidAndUserId(portfolioUuid, userId))
                .thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> statisticsService.getPortfolioStatistics(portfolioUuid, userId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Portfolio not found with uuid: " + portfolioUuid);

        verify(positionRepository, never()).findByPortfolioIdAndPortfolioUserId(anyLong(), anyString());
    }

    @Test
    void getPortfolioStatistics_WithNullCurrentPrice_ShouldUseZeroPrice() {
        // Arrange
        testStock1.setCurrentPrice(null); // Null current price
        when(portfolioRepository.findByUuidAndUserId(portfolioUuid, userId))
                .thenReturn(Optional.of(testPortfolio));
        when(positionRepository.findByPortfolioIdAndPortfolioUserId(1L, userId))
                .thenReturn(Arrays.asList(testPositions.get(0))); // Only position with null price stock

        // Act
        PortfolioStatisticsDTO result = statisticsService.getPortfolioStatistics(portfolioUuid, userId);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getTotalInvestment()).isEqualByComparingTo("1400");
        // Current value should be 0 because getCurrentPriceSafe() returns 0 for null
        assertThat(result.getTotalCurrentValue()).isEqualByComparingTo("0");
        assertThat(result.getTotalGainLoss()).isEqualByComparingTo("-1400");
    }

    @Test
    void getUserPortfoliosSummary_WithMultiplePortfolios_ShouldCalculateAggregateStatistics() {
        // Arrange
        Portfolio portfolio2 = new Portfolio(userId, "Portfolio 2", "Description 2");
        portfolio2.setId(2L);
        List<Portfolio> userPortfolios = Arrays.asList(testPortfolio, portfolio2);
        
        when(portfolioRepository.findByUserIdOrderByCreatedAtDesc(userId))
                .thenReturn(userPortfolios);
        when(positionRepository.findByPortfolioIdInAndPortfolioUserId(Arrays.asList(1L, 2L), userId))
                .thenReturn(testPositions);

        // Act
        PortfolioSummaryDTO result = statisticsService.getUserPortfoliosSummary(userId);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getTotalPortfolios()).isEqualTo(2);
        assertThat(result.getTotalActivePositions()).isEqualTo(2);
        assertThat(result.getTotalClosedPositions()).isEqualTo(1);
        assertThat(result.getTotalDistinctStocks()).isEqualTo(2);
        assertThat(result.getTotalInvestment()).isEqualByComparingTo("14075");
        assertThat(result.getTotalCurrentValue()).isEqualByComparingTo("14750");
        assertThat(result.getTotalGainLoss()).isEqualByComparingTo("675");
        assertThat(result.getTotalGainLossPercentage()).isCloseTo(BigDecimal.valueOf(4.795), 
                org.assertj.core.api.Assertions.within(BigDecimal.valueOf(0.01)));

        verify(portfolioRepository).findByUserIdOrderByCreatedAtDesc(userId);
        verify(positionRepository).findByPortfolioIdInAndPortfolioUserId(Arrays.asList(1L, 2L), userId);
    }

    @Test
    void getUserPortfoliosSummary_NoPortfolios_ShouldReturnZeroSummary() {
        // Arrange
        when(portfolioRepository.findByUserIdOrderByCreatedAtDesc(userId))
                .thenReturn(Collections.emptyList());

        // Act
        PortfolioSummaryDTO result = statisticsService.getUserPortfoliosSummary(userId);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getTotalPortfolios()).isEqualTo(0);
        assertThat(result.getTotalActivePositions()).isEqualTo(0);
        assertThat(result.getTotalClosedPositions()).isEqualTo(0);
        assertThat(result.getTotalDistinctStocks()).isEqualTo(0);
        assertThat(result.getTotalInvestment()).isEqualByComparingTo("0");
        assertThat(result.getTotalCurrentValue()).isEqualByComparingTo("0");
        assertThat(result.getTotalGainLoss()).isEqualByComparingTo("0");
        assertThat(result.getTotalGainLossPercentage()).isEqualByComparingTo("0");

        verify(positionRepository, never()).findByPortfolioIdInAndPortfolioUserId(anyList(), anyString());
    }

    @Test
    void getUserPortfoliosSummary_PortfoliosButNoPositions_ShouldReturnZeroValues() {
        // Arrange
        when(portfolioRepository.findByUserIdOrderByCreatedAtDesc(userId))
                .thenReturn(Arrays.asList(testPortfolio));
        when(positionRepository.findByPortfolioIdInAndPortfolioUserId(Arrays.asList(1L), userId))
                .thenReturn(Collections.emptyList());

        // Act
        PortfolioSummaryDTO result = statisticsService.getUserPortfoliosSummary(userId);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getTotalPortfolios()).isEqualTo(1);
        assertThat(result.getTotalActivePositions()).isEqualTo(0);
        assertThat(result.getTotalClosedPositions()).isEqualTo(0);
        assertThat(result.getTotalDistinctStocks()).isEqualTo(0);
        assertThat(result.getTotalInvestment()).isEqualByComparingTo("0");
        assertThat(result.getTotalCurrentValue()).isEqualByComparingTo("0");
        assertThat(result.getTotalGainLoss()).isEqualByComparingTo("0");
        assertThat(result.getTotalGainLossPercentage()).isEqualByComparingTo("0");
    }

    @Test
    void getUserPortfoliosSummary_ZeroInvestment_ShouldHandleGainLossPercentageCalculation() {
        // Arrange - Create position with zero quantity
        PortfolioPosition zeroPosition = new PortfolioPosition();
        zeroPosition.setId(4L);
        zeroPosition.setPortfolio(testPortfolio);
        zeroPosition.setStock(testStock1);
        zeroPosition.setQuantity(BigDecimal.ZERO);
        zeroPosition.setAverageCostBasis(BigDecimal.valueOf(100));
        zeroPosition.setStatus(PositionStatus.ACTIVE);

        when(portfolioRepository.findByUserIdOrderByCreatedAtDesc(userId))
                .thenReturn(Arrays.asList(testPortfolio));
        when(positionRepository.findByPortfolioIdInAndPortfolioUserId(Arrays.asList(1L), userId))
                .thenReturn(Arrays.asList(zeroPosition));

        // Act
        PortfolioSummaryDTO result = statisticsService.getUserPortfoliosSummary(userId);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getTotalInvestment()).isEqualByComparingTo("0");
        assertThat(result.getTotalCurrentValue()).isEqualByComparingTo("0");
        assertThat(result.getTotalGainLoss()).isEqualByComparingTo("0");
        assertThat(result.getTotalGainLossPercentage()).isEqualByComparingTo("0");
    }
}