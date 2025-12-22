package com.basis.api.features.investment.portfolio;

import com.basis.api.features.investment.portfolio.dto.CreatePortfolioRequest;
import com.basis.api.features.investment.portfolio.dto.PortfolioDTO;
import com.basis.api.features.investment.portfolio.dto.PortfolioStatisticsDTO;
import com.basis.api.features.investment.portfolio.dto.PortfolioSummaryDTO;
import com.basis.api.features.investment.portfolio.dto.StockGroupDTO;
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
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/portfolios")
@Tag(name = "Portfolios", description = "Investment portfolio management endpoints")
@SecurityRequirement(name = "bearer-key")
public class PortfolioController {

    private static final Logger logger = LoggerFactory.getLogger(PortfolioController.class);

    private final PortfolioService portfolioService;
    private final PortfolioStatisticsService portfolioStatisticsService;
    private final PositionAggregationService positionAggregationService;

    public PortfolioController(PortfolioService portfolioService,
                              PortfolioStatisticsService portfolioStatisticsService,
                              PositionAggregationService positionAggregationService) {
        this.portfolioService = portfolioService;
        this.portfolioStatisticsService = portfolioStatisticsService;
        this.positionAggregationService = positionAggregationService;
    }

    @PostMapping
    @Operation(summary = "Create portfolio", description = "Create a new investment portfolio")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Portfolio created successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid request data"),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<PortfolioDTO> createPortfolio(
            @Valid @RequestBody CreatePortfolioRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        PortfolioDTO portfolio = portfolioService.createPortfolio(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(portfolio);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get portfolio by ID", description = "Retrieve a specific portfolio by its ID")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Portfolio found"),
        @ApiResponse(responseCode = "404", description = "Portfolio not found"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "403", description = "Portfolio does not belong to user")
    })
    public ResponseEntity<PortfolioDTO> getPortfolio(
            @PathVariable @Parameter(description = "Portfolio ID") Long id,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        PortfolioDTO portfolio = portfolioService.getPortfolio(id, userId);
        return ResponseEntity.ok(portfolio);
    }

    @GetMapping("/uuid/{uuid}")
    @Operation(summary = "Get portfolio by UUID", description = "Retrieve a specific portfolio by its UUID")
    public ResponseEntity<PortfolioDTO> getPortfolioByUuid(
            @PathVariable @Parameter(description = "Portfolio UUID") UUID uuid,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        PortfolioDTO portfolio = portfolioService.getPortfolioByUuid(uuid, userId);
        return ResponseEntity.ok(portfolio);
    }

    @GetMapping
    @Operation(summary = "Get user portfolios", description = "Get all portfolios for the authenticated user")
    public ResponseEntity<List<PortfolioDTO>> getUserPortfolios(@AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        List<PortfolioDTO> portfolios = portfolioService.getUserPortfolios(userId);
        return ResponseEntity.ok(portfolios);
    }

    @GetMapping("/paged")
    @Operation(summary = "Get portfolios paged", description = "Get user portfolios with pagination")
    public ResponseEntity<Page<PortfolioDTO>> getUserPortfoliosPaged(
            @RequestParam(defaultValue = "0") @Parameter(description = "Page number") int page,
            @RequestParam(defaultValue = "20") @Parameter(description = "Page size") int size,
            @RequestParam(defaultValue = "createdAt") @Parameter(description = "Sort field") String sortBy,
            @RequestParam(defaultValue = "desc") @Parameter(description = "Sort direction") String sortDir,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        Page<PortfolioDTO> portfolios = portfolioService.getUserPortfoliosPaged(userId, page, size, sortBy, sortDir);
        return ResponseEntity.ok(portfolios);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update portfolio", description = "Update an existing portfolio")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Portfolio updated successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid request data"),
        @ApiResponse(responseCode = "404", description = "Portfolio not found"),
        @ApiResponse(responseCode = "403", description = "Portfolio does not belong to user")
    })
    public ResponseEntity<PortfolioDTO> updatePortfolio(
            @PathVariable @Parameter(description = "Portfolio ID") Long id,
            @Valid @RequestBody CreatePortfolioRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        PortfolioDTO portfolio = portfolioService.updatePortfolio(id, request, userId);
        return ResponseEntity.ok(portfolio);
    }

    @PutMapping("/uuid/{uuid}")
    @Operation(summary = "Update portfolio by UUID", description = "Update an existing portfolio by UUID")
    public ResponseEntity<PortfolioDTO> updatePortfolioByUuid(
            @PathVariable @Parameter(description = "Portfolio UUID") UUID uuid,
            @Valid @RequestBody CreatePortfolioRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        // Get portfolio first to find the ID
        PortfolioDTO existingPortfolio = portfolioService.getPortfolioByUuid(uuid, userId);
        PortfolioDTO portfolio = portfolioService.updatePortfolio(existingPortfolio.getId(), request, userId);
        return ResponseEntity.ok(portfolio);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete portfolio", description = "Delete a portfolio and all its positions")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Portfolio deleted successfully"),
        @ApiResponse(responseCode = "404", description = "Portfolio not found"),
        @ApiResponse(responseCode = "403", description = "Portfolio does not belong to user")
    })
    public ResponseEntity<Void> deletePortfolio(
            @PathVariable @Parameter(description = "Portfolio ID") Long id,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        portfolioService.deletePortfolio(id, userId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/uuid/{uuid}")
    @Operation(summary = "Delete portfolio by UUID", description = "Delete a portfolio and all its positions by UUID")
    public ResponseEntity<Void> deletePortfolioByUuid(
            @PathVariable @Parameter(description = "Portfolio UUID") UUID uuid,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        // Get portfolio first to find the ID
        PortfolioDTO existingPortfolio = portfolioService.getPortfolioByUuid(uuid, userId);
        portfolioService.deletePortfolio(existingPortfolio.getId(), userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/count")
    @Operation(summary = "Get portfolio count", description = "Get the number of portfolios for the user")
    public ResponseEntity<Long> getUserPortfolioCount(@AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        long count = portfolioService.getUserPortfolioCount(userId);
        return ResponseEntity.ok(count);
    }

    // Portfolio Statistics Endpoints
    @GetMapping("/{uuid}/statistics")
    @Operation(summary = "Get portfolio statistics", description = "Get comprehensive statistics for a specific portfolio")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Statistics retrieved successfully"),
        @ApiResponse(responseCode = "404", description = "Portfolio not found"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "403", description = "Portfolio does not belong to user")
    })
    public ResponseEntity<PortfolioStatisticsDTO> getPortfolioStatistics(
            @PathVariable @Parameter(description = "Portfolio UUID") UUID uuid,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        PortfolioStatisticsDTO statistics = portfolioStatisticsService.getPortfolioStatistics(uuid, userId);
        return ResponseEntity.ok(statistics);
    }

    @GetMapping("/summary")
    @Operation(summary = "Get portfolios summary", description = "Get summary statistics for all user portfolios")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Summary retrieved successfully"),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<PortfolioSummaryDTO> getPortfoliosSummary(@AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        PortfolioSummaryDTO summary = portfolioStatisticsService.getUserPortfoliosSummary(userId);
        return ResponseEntity.ok(summary);
    }

    // Stock Grouping Endpoints
    @GetMapping("/{uuid}/stock-groups")
    @Operation(summary = "Get stock groups", description = "Get all stock groups for a portfolio")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Stock groups retrieved successfully"),
        @ApiResponse(responseCode = "404", description = "Portfolio not found"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "403", description = "Portfolio does not belong to user")
    })
    public ResponseEntity<List<StockGroupDTO>> getStockGroups(
            @PathVariable @Parameter(description = "Portfolio UUID") UUID uuid,
            @RequestParam(required = false) @Parameter(description = "Search term") String search,
            @RequestParam(required = false, defaultValue = "symbol") @Parameter(description = "Sort by field") String sortBy,
            @RequestParam(required = false, defaultValue = "asc") @Parameter(description = "Sort direction") String sortDir,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        List<StockGroupDTO> stockGroups = positionAggregationService.getStockGroupsFiltered(
            uuid, userId, search, sortBy, sortDir);
        return ResponseEntity.ok(stockGroups);
    }

    @GetMapping("/{uuid}/stock-groups/{symbol}")
    @Operation(summary = "Get stock group", description = "Get a specific stock group for a portfolio")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Stock group retrieved successfully"),
        @ApiResponse(responseCode = "404", description = "Portfolio or stock group not found"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "403", description = "Portfolio does not belong to user")
    })
    public ResponseEntity<StockGroupDTO> getStockGroup(
            @PathVariable @Parameter(description = "Portfolio UUID") UUID uuid,
            @PathVariable @Parameter(description = "Stock symbol") String symbol,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        StockGroupDTO stockGroup = positionAggregationService.getStockGroup(uuid, symbol, userId);
        return ResponseEntity.ok(stockGroup);
    }
}