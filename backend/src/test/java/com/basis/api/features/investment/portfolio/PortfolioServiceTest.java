package com.basis.api.features.investment.portfolio;

import com.basis.api.features.investment.portfolio.dto.CreatePortfolioRequest;
import com.basis.api.features.investment.portfolio.dto.PortfolioDTO;
import com.basis.api.shared.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;

import java.time.ZonedDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PortfolioServiceTest {

    @Mock
    private PortfolioRepository portfolioRepository;

    @InjectMocks
    private PortfolioService portfolioService;

    private String userId;
    private Portfolio testPortfolio;
    private CreatePortfolioRequest createRequest;

    @BeforeEach
    void setUp() {
        userId = "test-user-123";
        testPortfolio = new Portfolio(userId, "Test Portfolio", "Test Description");
        testPortfolio.setId(1L);
        testPortfolio.setUuid(UUID.randomUUID());
        testPortfolio.setCreatedAt(ZonedDateTime.now());
        testPortfolio.setUpdatedAt(ZonedDateTime.now());
        
        createRequest = new CreatePortfolioRequest();
        createRequest.setName("New Portfolio");
        createRequest.setDescription("New Portfolio Description");
    }

    @Test
    void createPortfolio_ShouldCreateAndReturnPortfolioDTO() {
        // Arrange
        when(portfolioRepository.save(any(Portfolio.class))).thenReturn(testPortfolio);

        // Act
        PortfolioDTO result = portfolioService.createPortfolio(createRequest, userId);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getName()).isEqualTo(testPortfolio.getName());
        assertThat(result.getDescription()).isEqualTo(testPortfolio.getDescription());
        assertThat(result.getUserId()).isEqualTo(userId);

        // Verify repository interaction
        ArgumentCaptor<Portfolio> portfolioCaptor = ArgumentCaptor.forClass(Portfolio.class);
        verify(portfolioRepository).save(portfolioCaptor.capture());
        Portfolio savedPortfolio = portfolioCaptor.getValue();
        assertThat(savedPortfolio.getName()).isEqualTo(createRequest.getName());
        assertThat(savedPortfolio.getDescription()).isEqualTo(createRequest.getDescription());
        assertThat(savedPortfolio.getUserId()).isEqualTo(userId);
    }

    @Test
    void getPortfolio_WhenExists_ShouldReturnPortfolioDTO() {
        // Arrange
        when(portfolioRepository.findById(1L)).thenReturn(Optional.of(testPortfolio));

        // Act
        PortfolioDTO result = portfolioService.getPortfolio(1L, userId);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(testPortfolio.getId());
        assertThat(result.getName()).isEqualTo(testPortfolio.getName());
        verify(portfolioRepository).findById(1L);
    }

    @Test
    void getPortfolio_WhenNotExists_ShouldThrowResourceNotFoundException() {
        // Arrange
        when(portfolioRepository.findById(1L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> portfolioService.getPortfolio(1L, userId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Portfolio not found with id: 1");
    }

    @Test
    void getPortfolio_WhenBelongsToAnotherUser_ShouldThrowIllegalArgumentException() {
        // Arrange
        when(portfolioRepository.findById(1L)).thenReturn(Optional.of(testPortfolio));

        // Act & Assert
        assertThatThrownBy(() -> portfolioService.getPortfolio(1L, "another-user"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Portfolio does not belong to user");
    }

    @Test
    void getPortfolioByUuid_WhenExists_ShouldReturnPortfolioDTO() {
        // Arrange
        UUID uuid = testPortfolio.getUuid();
        when(portfolioRepository.findByUuid(uuid)).thenReturn(Optional.of(testPortfolio));

        // Act
        PortfolioDTO result = portfolioService.getPortfolioByUuid(uuid, userId);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getUuid()).isEqualTo(uuid);
        assertThat(result.getName()).isEqualTo(testPortfolio.getName());
        verify(portfolioRepository).findByUuid(uuid);
    }

    @Test
    void getPortfolioByUuid_WhenNotExists_ShouldThrowResourceNotFoundException() {
        // Arrange
        UUID uuid = UUID.randomUUID();
        when(portfolioRepository.findByUuid(uuid)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> portfolioService.getPortfolioByUuid(uuid, userId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Portfolio not found with UUID: " + uuid);
    }

    @Test
    void getUserPortfolios_ShouldReturnListOfPortfolioDTOs() {
        // Arrange
        Portfolio portfolio2 = new Portfolio(userId, "Portfolio 2", "Description 2");
        portfolio2.setId(2L);
        portfolio2.setUuid(UUID.randomUUID());
        List<Portfolio> portfolios = Arrays.asList(testPortfolio, portfolio2);
        when(portfolioRepository.findByUserIdOrderByCreatedAtDesc(userId)).thenReturn(portfolios);

        // Act
        List<PortfolioDTO> result = portfolioService.getUserPortfolios(userId);

        // Assert
        assertThat(result).hasSize(2);
        assertThat(result.get(0).getName()).isEqualTo(testPortfolio.getName());
        assertThat(result.get(1).getName()).isEqualTo(portfolio2.getName());
        verify(portfolioRepository).findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Test
    void getUserPortfolios_WhenNoPortfolios_ShouldReturnEmptyList() {
        // Arrange
        when(portfolioRepository.findByUserIdOrderByCreatedAtDesc(userId)).thenReturn(Arrays.asList());

        // Act
        List<PortfolioDTO> result = portfolioService.getUserPortfolios(userId);

        // Assert
        assertThat(result).isEmpty();
        verify(portfolioRepository).findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Test
    void getUserPortfoliosPaged_ShouldReturnPagedResults() {
        // Arrange
        List<Portfolio> portfolios = Arrays.asList(testPortfolio);
        Page<Portfolio> portfolioPage = new PageImpl<>(portfolios, PageRequest.of(0, 10, Sort.by("createdAt").descending()), 1);
        when(portfolioRepository.findByUserId(eq(userId), any(Pageable.class))).thenReturn(portfolioPage);

        // Act
        Page<PortfolioDTO> result = portfolioService.getUserPortfoliosPaged(userId, 0, 10, "createdAt", "desc");

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent().get(0).getName()).isEqualTo(testPortfolio.getName());
        
        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(portfolioRepository).findByUserId(eq(userId), pageableCaptor.capture());
        Pageable capturedPageable = pageableCaptor.getValue();
        assertThat(capturedPageable.getPageNumber()).isEqualTo(0);
        assertThat(capturedPageable.getPageSize()).isEqualTo(10);
        assertThat(capturedPageable.getSort().getOrderFor("createdAt").isDescending()).isTrue();
    }

    @Test
    void getUserPortfoliosPaged_WithAscendingSort_ShouldReturnCorrectlySortedResults() {
        // Arrange
        List<Portfolio> portfolios = Arrays.asList(testPortfolio);
        Page<Portfolio> portfolioPage = new PageImpl<>(portfolios, PageRequest.of(0, 10, Sort.by("name").ascending()), 1);
        when(portfolioRepository.findByUserId(eq(userId), any(Pageable.class))).thenReturn(portfolioPage);

        // Act
        Page<PortfolioDTO> result = portfolioService.getUserPortfoliosPaged(userId, 0, 10, "name", "asc");

        // Assert
        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(portfolioRepository).findByUserId(eq(userId), pageableCaptor.capture());
        Pageable capturedPageable = pageableCaptor.getValue();
        assertThat(capturedPageable.getSort().getOrderFor("name").isAscending()).isTrue();
    }

    @Test
    void updatePortfolio_WhenValid_ShouldUpdateAndReturnPortfolioDTO() {
        // Arrange
        when(portfolioRepository.findById(1L)).thenReturn(Optional.of(testPortfolio));
        when(portfolioRepository.save(any(Portfolio.class))).thenReturn(testPortfolio);

        // Act
        PortfolioDTO result = portfolioService.updatePortfolio(1L, createRequest, userId);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
        
        verify(portfolioRepository).findById(1L);
        ArgumentCaptor<Portfolio> portfolioCaptor = ArgumentCaptor.forClass(Portfolio.class);
        verify(portfolioRepository).save(portfolioCaptor.capture());
        Portfolio updatedPortfolio = portfolioCaptor.getValue();
        assertThat(updatedPortfolio.getName()).isEqualTo(createRequest.getName());
        assertThat(updatedPortfolio.getDescription()).isEqualTo(createRequest.getDescription());
    }

    @Test
    void updatePortfolio_WhenNotExists_ShouldThrowResourceNotFoundException() {
        // Arrange
        when(portfolioRepository.findById(1L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> portfolioService.updatePortfolio(1L, createRequest, userId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Portfolio not found with id: 1");
    }

    @Test
    void updatePortfolio_WhenBelongsToAnotherUser_ShouldThrowIllegalArgumentException() {
        // Arrange
        when(portfolioRepository.findById(1L)).thenReturn(Optional.of(testPortfolio));

        // Act & Assert
        assertThatThrownBy(() -> portfolioService.updatePortfolio(1L, createRequest, "another-user"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Portfolio does not belong to user");
    }

    @Test
    void deletePortfolio_WhenValid_ShouldDeletePortfolio() {
        // Arrange
        when(portfolioRepository.findById(1L)).thenReturn(Optional.of(testPortfolio));

        // Act
        portfolioService.deletePortfolio(1L, userId);

        // Assert
        verify(portfolioRepository).findById(1L);
        verify(portfolioRepository).delete(testPortfolio);
    }

    @Test
    void deletePortfolio_WhenNotExists_ShouldThrowResourceNotFoundException() {
        // Arrange
        when(portfolioRepository.findById(1L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> portfolioService.deletePortfolio(1L, userId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Portfolio not found with id: 1");
        
        verify(portfolioRepository, never()).delete(any(Portfolio.class));
    }

    @Test
    void deletePortfolio_WhenBelongsToAnotherUser_ShouldThrowIllegalArgumentException() {
        // Arrange
        when(portfolioRepository.findById(1L)).thenReturn(Optional.of(testPortfolio));

        // Act & Assert
        assertThatThrownBy(() -> portfolioService.deletePortfolio(1L, "another-user"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Portfolio does not belong to user");
        
        verify(portfolioRepository, never()).delete(any(Portfolio.class));
    }

    @Test
    void getUserPortfolioCount_ShouldReturnCount() {
        // Arrange
        when(portfolioRepository.countByUserId(userId)).thenReturn(5L);

        // Act
        long count = portfolioService.getUserPortfolioCount(userId);

        // Assert
        assertThat(count).isEqualTo(5L);
        verify(portfolioRepository).countByUserId(userId);
    }

    @Test
    void getUserPortfolioCount_WhenNoPortfolios_ShouldReturnZero() {
        // Arrange
        when(portfolioRepository.countByUserId(userId)).thenReturn(0L);

        // Act
        long count = portfolioService.getUserPortfolioCount(userId);

        // Assert
        assertThat(count).isEqualTo(0L);
        verify(portfolioRepository).countByUserId(userId);
    }
}