package com.basis.api.features.investment.position;

import com.basis.api.features.investment.portfolio.PortfolioService;
import com.basis.api.features.investment.portfolio.dto.PortfolioDTO;
import com.basis.api.features.investment.position.dto.BuyPositionRequest;
import com.basis.api.features.investment.position.dto.PortfolioPositionDTO;
import com.basis.api.features.investment.position.dto.SellPositionRequest;
import com.basis.api.features.investment.position.PositionStatus;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith({SpringExtension.class, MockitoExtension.class})
@WebMvcTest(controllers = {PortfolioPositionController.class, PortfolioPositionUuidController.class, UserPositionController.class})
class PortfolioPositionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PortfolioPositionService positionService;

    @MockBean
    private PortfolioService portfolioService;

    @Autowired
    private ObjectMapper objectMapper;

    private final String userId = "user123";
    private final Long portfolioId = 1L;
    private final UUID portfolioUuid = UUID.randomUUID();
    private final Long positionId = 100L;
    private final UUID positionUuid = UUID.randomUUID();

    private PortfolioPositionDTO mockPosition;
    private BuyPositionRequest buyRequest;
    private SellPositionRequest sellRequest;
    private PortfolioDTO mockPortfolio;

    @BeforeEach
    void setUp() {
        // Setup mock position
        mockPosition = new PortfolioPositionDTO();
        mockPosition.setId(positionId);
        mockPosition.setUuid(positionUuid);
        mockPosition.setPortfolioId(portfolioId);
        
        // Create mock stock
        com.basis.api.features.stock.master.dto.StockMasterDTO stockDTO = new com.basis.api.features.stock.master.dto.StockMasterDTO();
        stockDTO.setId(1L);
        stockDTO.setSymbol("AAPL");
        stockDTO.setCompanyName("Apple Inc.");
        mockPosition.setStock(stockDTO);
        
        mockPosition.setQuantity(new BigDecimal("10"));
        mockPosition.setAverageCostBasis(new BigDecimal("150.00"));
        mockPosition.setTotalCost(new BigDecimal("1500.00"));
        mockPosition.setCurrentValue(new BigDecimal("1800.00"));
        mockPosition.setUnrealizedGainLoss(new BigDecimal("300.00"));
        mockPosition.setUnrealizedGainLossPercentage(new BigDecimal("20.00"));
        mockPosition.setStatus(PositionStatus.ACTIVE);
        mockPosition.setFirstPurchaseDate(LocalDate.now());
        mockPosition.setLastTransactionDate(LocalDate.now());
        mockPosition.setCreatedAt(ZonedDateTime.now());
        mockPosition.setUpdatedAt(ZonedDateTime.now());

        // Setup buy request
        buyRequest = new BuyPositionRequest();
        buyRequest.setStockSymbol("AAPL");
        buyRequest.setCompanyName("Apple Inc.");
        buyRequest.setQuantity(new BigDecimal("10"));
        buyRequest.setPricePerShare(new BigDecimal("150.00"));
        buyRequest.setTransactionDate(LocalDate.now());
        buyRequest.setNotes("Test buy");

        // Setup sell request
        sellRequest = new SellPositionRequest();
        sellRequest.setPositionId(positionId);
        sellRequest.setQuantity(new BigDecimal("5"));
        sellRequest.setPricePerShare(new BigDecimal("180.00"));
        sellRequest.setTransactionDate(LocalDate.now());
        sellRequest.setNotes("Test sell");

        // Setup mock portfolio
        mockPortfolio = new PortfolioDTO();
        mockPortfolio.setId(portfolioId);
        mockPortfolio.setUuid(portfolioUuid);
        mockPortfolio.setUserId(userId);
        mockPortfolio.setName("Test Portfolio");
    }

    // PortfolioPositionController Tests

    @Test
    @WithMockUser
    void testBuyStock() throws Exception {
        when(positionService.buyStock(eq(portfolioId), eq(userId), any(BuyPositionRequest.class)))
                .thenReturn(mockPosition);

        mockMvc.perform(post("/api/v1/portfolios/{portfolioId}/positions/buy", portfolioId)
                        .with(jwt().jwt(jwt -> jwt.subject(userId)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buyRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(positionId))
                .andExpect(jsonPath("$.stock.symbol").value("AAPL"))
                .andExpect(jsonPath("$.quantity").value(10))
                .andExpect(jsonPath("$.totalCost").value(1500.00));

        verify(positionService).buyStock(eq(portfolioId), eq(userId), any(BuyPositionRequest.class));
    }

    @Test
    @WithMockUser
    void testSellStock() throws Exception {
        when(positionService.sellStock(eq(userId), any(SellPositionRequest.class)))
                .thenReturn(mockPosition);

        mockMvc.perform(post("/api/v1/portfolios/{portfolioId}/positions/sell", portfolioId)
                        .with(jwt().jwt(jwt -> jwt.subject(userId)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sellRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(positionId))
                .andExpect(jsonPath("$.stock.symbol").value("AAPL"));

        verify(positionService).sellStock(eq(userId), any(SellPositionRequest.class));
    }

    @Test
    @WithMockUser
    void testGetPortfolioPositions() throws Exception {
        List<PortfolioPositionDTO> positions = Arrays.asList(mockPosition);
        when(positionService.getPortfolioPositions(portfolioId, userId)).thenReturn(positions);

        mockMvc.perform(get("/api/v1/portfolios/{portfolioId}/positions", portfolioId)
                        .with(jwt().jwt(jwt -> jwt.subject(userId))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(positionId))
                .andExpect(jsonPath("$[0].stock.symbol").value("AAPL"));

        verify(positionService).getPortfolioPositions(portfolioId, userId);
    }

    @Test
    @WithMockUser
    void testGetActivePositions() throws Exception {
        List<PortfolioPositionDTO> positions = Arrays.asList(mockPosition);
        when(positionService.getActivePortfolioPositions(portfolioId, userId)).thenReturn(positions);

        mockMvc.perform(get("/api/v1/portfolios/{portfolioId}/positions/active", portfolioId)
                        .with(jwt().jwt(jwt -> jwt.subject(userId))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].status").value("ACTIVE"));

        verify(positionService).getActivePortfolioPositions(portfolioId, userId);
    }

    @Test
    @WithMockUser
    void testGetPosition() throws Exception {
        when(positionService.getPosition(positionId, userId)).thenReturn(mockPosition);

        mockMvc.perform(get("/api/v1/portfolios/{portfolioId}/positions/{positionId}", portfolioId, positionId)
                        .with(jwt().jwt(jwt -> jwt.subject(userId))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(positionId))
                .andExpect(jsonPath("$.stock.symbol").value("AAPL"));

        verify(positionService).getPosition(positionId, userId);
    }

    @Test
    @WithMockUser
    void testGetPositionByUuid() throws Exception {
        when(positionService.getPositionByUuid(positionUuid, userId)).thenReturn(mockPosition);

        mockMvc.perform(get("/api/v1/portfolios/{portfolioId}/positions/uuid/{uuid}", portfolioId, positionUuid)
                        .with(jwt().jwt(jwt -> jwt.subject(userId))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.uuid").value(positionUuid.toString()))
                .andExpect(jsonPath("$.stock.symbol").value("AAPL"));

        verify(positionService).getPositionByUuid(positionUuid, userId);
    }

    @Test
    @WithMockUser
    void testGetPortfolioTotalValue() throws Exception {
        BigDecimal totalValue = new BigDecimal("50000.00");
        when(positionService.calculatePortfolioTotalValue(portfolioId, userId)).thenReturn(totalValue);

        mockMvc.perform(get("/api/v1/portfolios/{portfolioId}/positions/total-value", portfolioId)
                        .with(jwt().jwt(jwt -> jwt.subject(userId))))
                .andExpect(status().isOk())
                .andExpect(content().string("50000.00"));

        verify(positionService).calculatePortfolioTotalValue(portfolioId, userId);
    }

    @Test
    @WithMockUser
    void testDeletePosition() throws Exception {
        doNothing().when(positionService).deletePosition(positionId, userId);

        mockMvc.perform(delete("/api/v1/portfolios/{portfolioId}/positions/{positionId}", portfolioId, positionId)
                        .with(jwt().jwt(jwt -> jwt.subject(userId))))
                .andExpect(status().isNoContent());

        verify(positionService).deletePosition(positionId, userId);
    }

    @Test
    @WithMockUser
    void testDeletePositionByUuid() throws Exception {
        doNothing().when(positionService).deletePositionByUuid(positionUuid, userId);

        mockMvc.perform(delete("/api/v1/portfolios/{portfolioId}/positions/uuid/{uuid}", portfolioId, positionUuid)
                        .with(jwt().jwt(jwt -> jwt.subject(userId))))
                .andExpect(status().isNoContent());

        verify(positionService).deletePositionByUuid(positionUuid, userId);
    }

    // PortfolioPositionUuidController Tests

    @Test
    @WithMockUser
    void testGetPortfolioPositionsByUuid() throws Exception {
        List<PortfolioPositionDTO> positions = Arrays.asList(mockPosition);
        when(portfolioService.getPortfolioByUuid(portfolioUuid, userId)).thenReturn(mockPortfolio);
        when(positionService.getPortfolioPositions(portfolioId, userId)).thenReturn(positions);

        mockMvc.perform(get("/api/v1/portfolios/uuid/{portfolioUuid}/positions", portfolioUuid)
                        .with(jwt().jwt(jwt -> jwt.subject(userId))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(positionId));

        verify(portfolioService).getPortfolioByUuid(portfolioUuid, userId);
        verify(positionService).getPortfolioPositions(portfolioId, userId);
    }

    @Test
    @WithMockUser
    void testBuyStockByUuid() throws Exception {
        when(portfolioService.getPortfolioByUuid(portfolioUuid, userId)).thenReturn(mockPortfolio);
        when(positionService.buyStock(eq(portfolioId), eq(userId), any(BuyPositionRequest.class)))
                .thenReturn(mockPosition);

        mockMvc.perform(post("/api/v1/portfolios/uuid/{portfolioUuid}/positions", portfolioUuid)
                        .with(jwt().jwt(jwt -> jwt.subject(userId)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buyRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(positionId))
                .andExpect(jsonPath("$.stock.symbol").value("AAPL"));

        verify(portfolioService).getPortfolioByUuid(portfolioUuid, userId);
        verify(positionService).buyStock(eq(portfolioId), eq(userId), any(BuyPositionRequest.class));
    }

    @Test
    @WithMockUser
    void testSellPositionByUuid() throws Exception {
        when(positionService.getPositionByUuid(positionUuid, userId)).thenReturn(mockPosition);
        when(positionService.sellStock(eq(userId), any(SellPositionRequest.class)))
                .thenReturn(mockPosition);

        mockMvc.perform(post("/api/v1/portfolios/uuid/{portfolioUuid}/positions/{positionUuid}/sell", portfolioUuid, positionUuid)
                        .with(jwt().jwt(jwt -> jwt.subject(userId)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sellRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(positionId));

        verify(positionService).getPositionByUuid(positionUuid, userId);
        verify(positionService).sellStock(eq(userId), any(SellPositionRequest.class));
    }

    @Test
    @WithMockUser
    void testDeletePositionByUuidInUuidController() throws Exception {
        doNothing().when(positionService).deletePositionByUuid(positionUuid, userId);

        mockMvc.perform(delete("/api/v1/portfolios/uuid/{portfolioUuid}/positions/{positionUuid}", portfolioUuid, positionUuid)
                        .with(jwt().jwt(jwt -> jwt.subject(userId))))
                .andExpect(status().isNoContent());

        verify(positionService).deletePositionByUuid(positionUuid, userId);
    }

    // UserPositionController Tests

    @Test
    @WithMockUser
    void testGetUserPositions() throws Exception {
        List<PortfolioPositionDTO> positions = Arrays.asList(mockPosition);
        when(positionService.getUserPositions(userId)).thenReturn(positions);

        mockMvc.perform(get("/api/v1/positions")
                        .with(jwt().jwt(jwt -> jwt.subject(userId))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(positionId));

        verify(positionService).getUserPositions(userId);
    }

    @Test
    @WithMockUser
    void testGetActiveUserPositions() throws Exception {
        List<PortfolioPositionDTO> positions = Arrays.asList(mockPosition);
        when(positionService.getActiveUserPositions(userId)).thenReturn(positions);

        mockMvc.perform(get("/api/v1/positions/active")
                        .with(jwt().jwt(jwt -> jwt.subject(userId))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].status").value("ACTIVE"));

        verify(positionService).getActiveUserPositions(userId);
    }

    // Error Handling Tests

    @Test
    @WithMockUser
    void testBuyStock_InvalidRequest() throws Exception {
        BuyPositionRequest invalidRequest = new BuyPositionRequest();
        // Missing required fields

        mockMvc.perform(post("/api/v1/portfolios/{portfolioId}/positions/buy", portfolioId)
                        .with(jwt().jwt(jwt -> jwt.subject(userId)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest());

        verify(positionService, never()).buyStock(any(), any(), any());
    }

    @Test
    @WithMockUser
    void testGetPosition_NotFound() throws Exception {
        when(positionService.getPosition(positionId, userId))
                .thenThrow(new com.basis.api.shared.exception.ResourceNotFoundException("Position not found"));

        mockMvc.perform(get("/api/v1/portfolios/{portfolioId}/positions/{positionId}", portfolioId, positionId)
                        .with(jwt().jwt(jwt -> jwt.subject(userId))))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser
    void testDeletePosition_Forbidden() throws Exception {
        doThrow(new IllegalArgumentException("Position does not belong to user"))
                .when(positionService).deletePosition(positionId, userId);

        mockMvc.perform(delete("/api/v1/portfolios/{portfolioId}/positions/{positionId}", portfolioId, positionId)
                        .with(jwt().jwt(jwt -> jwt.subject(userId))))
                .andExpect(status().isInternalServerError());
    }

    @Test
    void testUnauthorizedAccess() throws Exception {
        mockMvc.perform(get("/api/v1/portfolios/{portfolioId}/positions", portfolioId))
                .andExpect(status().isUnauthorized());
    }
}