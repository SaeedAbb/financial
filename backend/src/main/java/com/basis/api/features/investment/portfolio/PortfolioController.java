package com.basis.api.features.investment.portfolio;

import com.basis.api.features.investment.dto.CreatePortfolioRequest;
import com.basis.api.features.investment.dto.PortfolioDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/portfolios")
@Tag(name = "Portfolios", description = "Investment portfolio management endpoints")
@SecurityRequirement(name = "bearer-key")
public class PortfolioController {

    private static final Logger logger = LoggerFactory.getLogger(PortfolioController.class);
    
    private final PortfolioService portfolioService;

    public PortfolioController(PortfolioService portfolioService) {
        this.portfolioService = portfolioService;
    }

    @PostMapping
    @Operation(summary = "Create a new portfolio", description = "Creates a new investment portfolio for the authenticated user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Portfolio created successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input data or portfolio name already exists"),
            @ApiResponse(responseCode = "401", description = "User not authenticated")
    })
    public ResponseEntity<PortfolioDTO> createPortfolio(
            @Valid @RequestBody CreatePortfolioRequest request,
            Authentication authentication) {
        
        String userId = getUserId(authentication);
        logger.info("Creating portfolio for user: {}", userId);
        
        PortfolioDTO savedPortfolio = portfolioService.createPortfolio(userId, request);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(savedPortfolio);
    }

    @GetMapping
    @Operation(summary = "Get user's portfolios", description = "Retrieves all portfolios for the authenticated user with pagination")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Portfolios retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "User not authenticated")
    })
    public ResponseEntity<Page<PortfolioDTO>> getUserPortfolios(
            @RequestParam(defaultValue = "0") @Parameter(description = "Page number") int page,
            @RequestParam(defaultValue = "10") @Parameter(description = "Page size") int size,
            @RequestParam(defaultValue = "createdAt") @Parameter(description = "Sort field") String sortBy,
            @RequestParam(defaultValue = "desc") @Parameter(description = "Sort direction") String sortDir,
            Authentication authentication) {
        
        String userId = getUserId(authentication);
        logger.debug("Fetching portfolios for user: {} (page: {}, size: {})", userId, page, size);
        
        Page<PortfolioDTO> portfolios = portfolioService.getUserPortfolios(userId, page, size, sortBy, sortDir);
        
        return ResponseEntity.ok(portfolios);
    }

    @GetMapping("/all")
    @Operation(summary = "Get all user's portfolios", description = "Retrieves all portfolios for the authenticated user without pagination")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Portfolios retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "User not authenticated")
    })
    public ResponseEntity<List<PortfolioDTO>> getAllUserPortfolios(Authentication authentication) {
        String userId = getUserId(authentication);
        logger.debug("Fetching all portfolios for user: {}", userId);
        
        List<PortfolioDTO> portfolios = portfolioService.getAllUserPortfolios(userId);
        
        return ResponseEntity.ok(portfolios);
    }

    @GetMapping("/{uuid}")
    @Operation(summary = "Get portfolio by UUID", description = "Retrieves a specific portfolio by its UUID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Portfolio retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "Portfolio not found"),
            @ApiResponse(responseCode = "401", description = "User not authenticated")
    })
    public ResponseEntity<PortfolioDTO> getPortfolioByUuid(
            @PathVariable @Parameter(description = "Portfolio UUID") UUID uuid,
            Authentication authentication) {
        
        String userId = getUserId(authentication);
        logger.debug("Fetching portfolio with UUID: {} for user: {}", uuid, userId);
        
        PortfolioDTO portfolio = portfolioService.getPortfolioByUuid(userId, uuid);
        
        return ResponseEntity.ok(portfolio);
    }

    @PutMapping("/{uuid}")
    @Operation(summary = "Update portfolio", description = "Updates an existing portfolio")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Portfolio updated successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input data or portfolio name already exists"),
            @ApiResponse(responseCode = "404", description = "Portfolio not found"),
            @ApiResponse(responseCode = "401", description = "User not authenticated")
    })
    public ResponseEntity<PortfolioDTO> updatePortfolio(
            @PathVariable @Parameter(description = "Portfolio UUID") UUID uuid,
            @Valid @RequestBody CreatePortfolioRequest request,
            Authentication authentication) {
        
        String userId = getUserId(authentication);
        logger.info("Updating portfolio with UUID: {} for user: {}", uuid, userId);
        
        PortfolioDTO updatedPortfolio = portfolioService.updatePortfolio(userId, uuid, request);
        
        return ResponseEntity.ok(updatedPortfolio);
    }

    @DeleteMapping("/{uuid}")
    @Operation(summary = "Delete portfolio", description = "Deletes a portfolio and all associated stocks and transactions")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Portfolio deleted successfully"),
            @ApiResponse(responseCode = "404", description = "Portfolio not found"),
            @ApiResponse(responseCode = "401", description = "User not authenticated")
    })
    public ResponseEntity<Void> deletePortfolio(
            @PathVariable @Parameter(description = "Portfolio UUID") UUID uuid,
            Authentication authentication) {
        
        String userId = getUserId(authentication);
        logger.info("Deleting portfolio with UUID: {} for user: {}", uuid, userId);
        
        portfolioService.deletePortfolio(userId, uuid);
        
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/search")
    @Operation(summary = "Search portfolios by name", description = "Search portfolios by name containing the given text")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Portfolios retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "User not authenticated")
    })
    public ResponseEntity<List<PortfolioDTO>> searchPortfolios(
            @RequestParam @Parameter(description = "Name to search for") String name,
            Authentication authentication) {
        
        String userId = getUserId(authentication);
        logger.debug("Searching portfolios for user: {} with name: {}", userId, name);
        
        List<PortfolioDTO> portfolios = portfolioService.searchPortfoliosByName(userId, name);
        
        return ResponseEntity.ok(portfolios);
    }

    @GetMapping("/summary")
    @Operation(summary = "Get portfolios summary", description = "Gets summary statistics for all user's portfolios")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Summary retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "User not authenticated")
    })
    public ResponseEntity<Map<String, Object>> getPortfoliosSummary(Authentication authentication) {
        String userId = getUserId(authentication);
        logger.debug("Fetching portfolios summary for user: {}", userId);
        
        List<PortfolioDTO> portfolios = portfolioService.getAllUserPortfolios(userId);
        
        Map<String, Object> summary = new HashMap<>();
        summary.put("totalPortfolios", portfolios.size());
        summary.put("totalActiveStocks", portfolios.stream().mapToInt(PortfolioDTO::getActiveStocksCount).sum());
        summary.put("totalSoldStocks", portfolios.stream().mapToInt(PortfolioDTO::getSoldStocksCount).sum());
        summary.put("totalInvestment", portfolios.stream()
                .map(PortfolioDTO::getTotalInvestment)
                .filter(java.util.Objects::nonNull)
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add));
        summary.put("totalGainLoss", portfolios.stream()
                .map(PortfolioDTO::getTotalGainLoss)
                .filter(java.util.Objects::nonNull)
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add));
        
        return ResponseEntity.ok(summary);
    }


    /**
     * Extract user ID from JWT token
     */
    private String getUserId(Authentication authentication) {
        if (authentication == null) {
            throw new IllegalArgumentException("Authentication is required");
        }
        
        Jwt jwt = (Jwt) authentication.getPrincipal();
        return jwt.getSubject();
    }
}