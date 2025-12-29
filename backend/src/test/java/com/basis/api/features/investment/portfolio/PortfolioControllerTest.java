package com.basis.api.features.investment.portfolio;

import com.basis.api.config.TestSecurityConfig;
import com.basis.api.features.investment.portfolio.dto.CreatePortfolioRequest;
import com.basis.api.features.investment.portfolio.dto.PortfolioDTO;
import com.basis.api.features.investment.portfolio.dto.PortfolioStatisticsDTO;
import com.basis.api.features.investment.portfolio.dto.PortfolioSummaryDTO;
import com.basis.api.shared.exception.ResourceNotFoundException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.security.oauth2.jwt.Jwt;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.ZonedDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(PortfolioController.class)
@Import(TestSecurityConfig.class)
class PortfolioControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private PortfolioService portfolioService;

    @MockBean
    private PortfolioStatisticsService portfolioStatisticsService;

    @MockBean
    private PositionAggregationService positionAggregationService;

    private PortfolioDTO testPortfolioDTO;
    private CreatePortfolioRequest createRequest;
    private String userId = "test-user-123";

    @BeforeEach
    void setUp() {
        testPortfolioDTO = new PortfolioDTO();
        testPortfolioDTO.setId(1L);
        testPortfolioDTO.setUuid(UUID.randomUUID());
        testPortfolioDTO.setUserId(userId);
        testPortfolioDTO.setName("Test Portfolio");
        testPortfolioDTO.setDescription("Test Description");
        testPortfolioDTO.setCreatedAt(ZonedDateTime.now());
        testPortfolioDTO.setUpdatedAt(ZonedDateTime.now());

        createRequest = new CreatePortfolioRequest();
        createRequest.setName("New Portfolio");
        createRequest.setDescription("New Portfolio Description");
    }

    @Test
    void createPortfolio_ShouldReturnCreatedPortfolio() throws Exception {
        // Arrange
        when(portfolioService.createPortfolio(any(CreatePortfolioRequest.class), eq(userId)))
                .thenReturn(testPortfolioDTO);

        // Act & Assert
        mockMvc.perform(post("/api/v1/portfolios")
                .with(jwt().jwt(builder -> builder.subject(userId)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createRequest)))
                .andDo(print())
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Test Portfolio"))
                .andExpect(jsonPath("$.description").value("Test Description"));

        verify(portfolioService).createPortfolio(any(CreatePortfolioRequest.class), eq(userId));
    }

    @Test
    void createPortfolio_InvalidRequest_ShouldReturnBadRequest() throws Exception {
        // Arrange - Empty name
        createRequest.setName("");

        // Act & Assert
        mockMvc.perform(post("/api/v1/portfolios")
                .with(jwt().jwt(builder -> builder.subject(userId)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isBadRequest());

        verify(portfolioService, never()).createPortfolio(any(), any());
    }

    @Test
    void getPortfolio_ExistingPortfolio_ShouldReturnPortfolio() throws Exception {
        // Arrange
        when(portfolioService.getPortfolio(1L, userId)).thenReturn(testPortfolioDTO);

        // Act & Assert
        mockMvc.perform(get("/api/v1/portfolios/1")
                .with(jwt().jwt(builder -> builder.subject(userId))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Test Portfolio"));

        verify(portfolioService).getPortfolio(1L, userId);
    }

    @Test
    void getPortfolio_NotFound_ShouldReturn404() throws Exception {
        // Arrange
        when(portfolioService.getPortfolio(999L, userId))
                .thenThrow(new ResourceNotFoundException("Portfolio not found"));

        // Act & Assert
        mockMvc.perform(get("/api/v1/portfolios/999")
                .with(jwt().jwt(builder -> builder.subject(userId))))
                .andExpect(status().isNotFound());
    }

    @Test
    void getPortfolioByUuid_ShouldReturnPortfolio() throws Exception {
        // Arrange
        UUID uuid = testPortfolioDTO.getUuid();
        when(portfolioService.getPortfolioByUuid(uuid, userId)).thenReturn(testPortfolioDTO);

        // Act & Assert
        mockMvc.perform(get("/api/v1/portfolios/uuid/{uuid}", uuid)
                .with(jwt().jwt(builder -> builder.subject(userId))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.uuid").value(uuid.toString()))
                .andExpect(jsonPath("$.name").value("Test Portfolio"));

        verify(portfolioService).getPortfolioByUuid(uuid, userId);
    }

    @Test
    void getUserPortfolios_ShouldReturnListOfPortfolios() throws Exception {
        // Arrange
        PortfolioDTO portfolio2 = new PortfolioDTO();
        portfolio2.setId(2L);
        portfolio2.setName("Portfolio 2");
        List<PortfolioDTO> portfolios = Arrays.asList(testPortfolioDTO, portfolio2);
        
        when(portfolioService.getUserPortfolios(userId)).thenReturn(portfolios);

        // Act & Assert
        mockMvc.perform(get("/api/v1/portfolios")
                .with(jwt().jwt(builder -> builder.subject(userId))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].name").value("Test Portfolio"))
                .andExpect(jsonPath("$[1].name").value("Portfolio 2"));

        verify(portfolioService).getUserPortfolios(userId);
    }

    @Test
    void getUserPortfoliosPaged_ShouldReturnPagedResult() throws Exception {
        // Arrange
        Page<PortfolioDTO> page = new PageImpl<>(
                Arrays.asList(testPortfolioDTO),
                PageRequest.of(0, 10),
                1
        );
        when(portfolioService.getUserPortfoliosPaged(userId, 0, 10, "createdAt", "desc"))
                .thenReturn(page);

        // Act & Assert
        mockMvc.perform(get("/api/v1/portfolios/paged")
                .with(jwt().jwt(builder -> builder.subject(userId)))
                .param("page", "0")
                .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].name").value("Test Portfolio"))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.totalPages").value(1));

        verify(portfolioService).getUserPortfoliosPaged(userId, 0, 10, "createdAt", "desc");
    }

    @Test
    void updatePortfolio_ValidRequest_ShouldReturnUpdatedPortfolio() throws Exception {
        // Arrange
        testPortfolioDTO.setName("Updated Portfolio");
        when(portfolioService.updatePortfolio(eq(1L), any(CreatePortfolioRequest.class), eq(userId)))
                .thenReturn(testPortfolioDTO);

        // Act & Assert
        mockMvc.perform(put("/api/v1/portfolios/1")
                .with(jwt().jwt(builder -> builder.subject(userId)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Updated Portfolio"));

        verify(portfolioService).updatePortfolio(eq(1L), any(CreatePortfolioRequest.class), eq(userId));
    }

    @Test
    void updatePortfolioByUuid_ShouldUpdateAndReturnPortfolio() throws Exception {
        // Arrange
        UUID uuid = testPortfolioDTO.getUuid();
        when(portfolioService.getPortfolioByUuid(uuid, userId)).thenReturn(testPortfolioDTO);
        when(portfolioService.updatePortfolio(eq(1L), any(CreatePortfolioRequest.class), eq(userId)))
                .thenReturn(testPortfolioDTO);

        // Act & Assert
        mockMvc.perform(put("/api/v1/portfolios/uuid/{uuid}", uuid)
                .with(jwt().jwt(builder -> builder.subject(userId)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isOk());

        verify(portfolioService).getPortfolioByUuid(uuid, userId);
        verify(portfolioService).updatePortfolio(eq(1L), any(CreatePortfolioRequest.class), eq(userId));
    }

    @Test
    void deletePortfolio_ShouldReturnNoContent() throws Exception {
        // Arrange
        doNothing().when(portfolioService).deletePortfolio(1L, userId);

        // Act & Assert
        mockMvc.perform(delete("/api/v1/portfolios/1")
                .with(jwt().jwt(builder -> builder.subject(userId))))
                .andExpect(status().isNoContent());

        verify(portfolioService).deletePortfolio(1L, userId);
    }

    @Test
    void deletePortfolioByUuid_ShouldDeleteAndReturnNoContent() throws Exception {
        // Arrange
        UUID uuid = testPortfolioDTO.getUuid();
        when(portfolioService.getPortfolioByUuid(uuid, userId)).thenReturn(testPortfolioDTO);
        doNothing().when(portfolioService).deletePortfolio(1L, userId);

        // Act & Assert
        mockMvc.perform(delete("/api/v1/portfolios/uuid/{uuid}", uuid)
                .with(jwt().jwt(builder -> builder.subject(userId))))
                .andExpect(status().isNoContent());

        verify(portfolioService).getPortfolioByUuid(uuid, userId);
        verify(portfolioService).deletePortfolio(1L, userId);
    }

    @Test
    void getUserPortfolioCount_ShouldReturnCount() throws Exception {
        // Arrange
        when(portfolioService.getUserPortfolioCount(userId)).thenReturn(5L);

        // Act & Assert
        mockMvc.perform(get("/api/v1/portfolios/count")
                .with(jwt().jwt(builder -> builder.subject(userId))))
                .andExpect(status().isOk())
                .andExpect(content().string("5"));

        verify(portfolioService).getUserPortfolioCount(userId);
    }

    @Test
    void getPortfolioStatistics_ShouldReturnStatistics() throws Exception {
        // Arrange
        UUID portfolioUuid = UUID.randomUUID();
        PortfolioStatisticsDTO statistics = new PortfolioStatisticsDTO(1L, portfolioUuid, "Test Portfolio");
        statistics.setTotalInvestment(BigDecimal.valueOf(10000));
        statistics.setTotalCurrentValue(BigDecimal.valueOf(12000));
        statistics.setTotalGainLoss(BigDecimal.valueOf(2000));
        statistics.setGainLossPercentage(BigDecimal.valueOf(20));
        statistics.setActivePositionsCount(5);
        statistics.setTotalPositionsCount(6);
        
        when(portfolioStatisticsService.getPortfolioStatistics(portfolioUuid, userId))
                .thenReturn(statistics);

        // Act & Assert
        mockMvc.perform(get("/api/v1/portfolios/{uuid}/statistics", portfolioUuid)
                .with(jwt().jwt(builder -> builder.subject(userId))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.portfolioId").value(1))
                .andExpect(jsonPath("$.portfolioName").value("Test Portfolio"))
                .andExpect(jsonPath("$.totalInvestment").value(10000))
                .andExpect(jsonPath("$.totalCurrentValue").value(12000))
                .andExpect(jsonPath("$.totalGainLoss").value(2000))
                .andExpect(jsonPath("$.gainLossPercentage").value(20))
                .andExpect(jsonPath("$.activePositionsCount").value(5));

        verify(portfolioStatisticsService).getPortfolioStatistics(portfolioUuid, userId);
    }

    @Test
    void getPortfoliosSummary_ShouldReturnSummary() throws Exception {
        // Arrange
        PortfolioSummaryDTO summary = new PortfolioSummaryDTO();
        summary.setTotalPortfolios(3);
        summary.setTotalActivePositions(15);
        summary.setTotalInvestment(BigDecimal.valueOf(50000));
        summary.setTotalCurrentValue(BigDecimal.valueOf(60000));
        summary.setTotalGainLoss(BigDecimal.valueOf(10000));
        
        when(portfolioStatisticsService.getUserPortfoliosSummary(userId))
                .thenReturn(summary);

        // Act & Assert
        mockMvc.perform(get("/api/v1/portfolios/summary")
                .with(jwt().jwt(builder -> builder.subject(userId))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalPortfolios").value(3))
                .andExpect(jsonPath("$.totalActivePositions").value(15))
                .andExpect(jsonPath("$.totalInvestment").value(50000))
                .andExpect(jsonPath("$.totalCurrentValue").value(60000))
                .andExpect(jsonPath("$.totalGainLoss").value(10000));

        verify(portfolioStatisticsService).getUserPortfoliosSummary(userId);
    }

    @Test
    void unauthorizedRequest_ShouldReturn401() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/v1/portfolios"))
                .andExpect(status().isUnauthorized());
    }
}