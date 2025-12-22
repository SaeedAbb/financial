package com.basis.api.features.investment.position;

import com.basis.api.features.investment.position.dto.BuyPositionRequest;
import com.basis.api.features.investment.position.dto.PortfolioPositionDTO;
import com.basis.api.features.investment.position.dto.SellPositionRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/portfolios/{portfolioId}/positions")
@Tag(name = "Portfolio Positions", description = "Portfolio position management endpoints")
public class PortfolioPositionController {

    private final PortfolioPositionService positionService;

    public PortfolioPositionController(PortfolioPositionService positionService) {
        this.positionService = positionService;
    }

    @PostMapping("/buy")
    @Operation(summary = "Buy stock", description = "Buy stock and add to portfolio position")
    public ResponseEntity<PortfolioPositionDTO> buyStock(
            @PathVariable @Parameter(description = "Portfolio ID") Long portfolioId,
            @Valid @RequestBody BuyPositionRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        PortfolioPositionDTO position = positionService.buyStock(portfolioId, userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(position);
    }

    @PostMapping("/sell")
    @Operation(summary = "Sell stock", description = "Sell stock from portfolio position")
    public ResponseEntity<PortfolioPositionDTO> sellStock(
            @PathVariable @Parameter(description = "Portfolio ID") Long portfolioId,
            @Valid @RequestBody SellPositionRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        PortfolioPositionDTO position = positionService.sellStock(userId, request);
        return ResponseEntity.ok(position);
    }

    @GetMapping
    @Operation(summary = "Get all positions", description = "Get all positions in a portfolio")
    public ResponseEntity<List<PortfolioPositionDTO>> getPortfolioPositions(
            @PathVariable @Parameter(description = "Portfolio ID") Long portfolioId,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        List<PortfolioPositionDTO> positions = positionService.getPortfolioPositions(portfolioId, userId);
        return ResponseEntity.ok(positions);
    }

    @GetMapping("/active")
    @Operation(summary = "Get active positions", description = "Get active positions in a portfolio")
    public ResponseEntity<List<PortfolioPositionDTO>> getActivePositions(
            @PathVariable @Parameter(description = "Portfolio ID") Long portfolioId,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        List<PortfolioPositionDTO> positions = positionService.getActivePortfolioPositions(portfolioId, userId);
        return ResponseEntity.ok(positions);
    }

    @GetMapping("/{positionId}")
    @Operation(summary = "Get position by ID", description = "Get a specific position by ID")
    public ResponseEntity<PortfolioPositionDTO> getPosition(
            @PathVariable @Parameter(description = "Portfolio ID") Long portfolioId,
            @PathVariable @Parameter(description = "Position ID") Long positionId,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        PortfolioPositionDTO position = positionService.getPosition(positionId, userId);
        return ResponseEntity.ok(position);
    }

    @GetMapping("/uuid/{uuid}")
    @Operation(summary = "Get position by UUID", description = "Get a specific position by UUID")
    public ResponseEntity<PortfolioPositionDTO> getPositionByUuid(
            @PathVariable @Parameter(description = "Portfolio ID") Long portfolioId,
            @PathVariable @Parameter(description = "Position UUID") UUID uuid,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        PortfolioPositionDTO position = positionService.getPositionByUuid(uuid, userId);
        return ResponseEntity.ok(position);
    }

    @GetMapping("/total-value")
    @Operation(summary = "Get portfolio total value", description = "Calculate total investment value of portfolio")
    public ResponseEntity<BigDecimal> getPortfolioTotalValue(
            @PathVariable @Parameter(description = "Portfolio ID") Long portfolioId,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        BigDecimal totalValue = positionService.calculatePortfolioTotalValue(portfolioId, userId);
        return ResponseEntity.ok(totalValue);
    }
}

@RestController
@RequestMapping("/api/v1/portfolios/uuid/{portfolioUuid}/positions")
@Tag(name = "Portfolio Positions (UUID)", description = "Portfolio position management endpoints using UUID")
class PortfolioPositionUuidController {

    private final PortfolioPositionService positionService;
    private final com.basis.api.features.investment.portfolio.PortfolioService portfolioService;

    public PortfolioPositionUuidController(PortfolioPositionService positionService,
                                           com.basis.api.features.investment.portfolio.PortfolioService portfolioService) {
        this.positionService = positionService;
        this.portfolioService = portfolioService;
    }

    @GetMapping
    @Operation(summary = "Get all positions by portfolio UUID", description = "Get all positions in a portfolio using UUID")
    public ResponseEntity<List<PortfolioPositionDTO>> getPortfolioPositionsByUuid(
            @PathVariable @Parameter(description = "Portfolio UUID") UUID portfolioUuid,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        // Convert UUID to ID first
        var portfolio = portfolioService.getPortfolioByUuid(portfolioUuid, userId);
        List<PortfolioPositionDTO> positions = positionService.getPortfolioPositions(portfolio.getId(), userId);
        return ResponseEntity.ok(positions);
    }

    @PostMapping
    @Operation(summary = "Buy stock by portfolio UUID", description = "Buy stock and add to portfolio position using UUID")
    public ResponseEntity<PortfolioPositionDTO> buyStockByUuid(
            @PathVariable @Parameter(description = "Portfolio UUID") UUID portfolioUuid,
            @Valid @RequestBody BuyPositionRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        // Convert UUID to ID first
        var portfolio = portfolioService.getPortfolioByUuid(portfolioUuid, userId);
        PortfolioPositionDTO position = positionService.buyStock(portfolio.getId(), userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(position);
    }

    @PostMapping("/{positionUuid}/sell")
    @Operation(summary = "Sell position by UUID", description = "Sell part or all of a position using UUID")
    public ResponseEntity<PortfolioPositionDTO> sellPositionByUuid(
            @PathVariable @Parameter(description = "Portfolio UUID") UUID portfolioUuid,
            @PathVariable @Parameter(description = "Position UUID") UUID positionUuid,
            @Valid @RequestBody SellPositionRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        // Get position to find the ID
        PortfolioPositionDTO existingPosition = positionService.getPositionByUuid(positionUuid, userId);
        // Set the position ID in the request
        request.setPositionId(existingPosition.getId());
        PortfolioPositionDTO position = positionService.sellStock(userId, request);
        return ResponseEntity.ok(position);
    }
}

@RestController
@RequestMapping("/api/v1/positions")
@Tag(name = "User Positions", description = "User-wide position endpoints")
class UserPositionController {

    private final PortfolioPositionService positionService;

    public UserPositionController(PortfolioPositionService positionService) {
        this.positionService = positionService;
    }

    @GetMapping
    @Operation(summary = "Get all user positions", description = "Get all positions across all user portfolios")
    public ResponseEntity<List<PortfolioPositionDTO>> getUserPositions(
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        List<PortfolioPositionDTO> positions = positionService.getUserPositions(userId);
        return ResponseEntity.ok(positions);
    }

    @GetMapping("/active")
    @Operation(summary = "Get active user positions", description = "Get active positions across all user portfolios")
    public ResponseEntity<List<PortfolioPositionDTO>> getActiveUserPositions(
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        List<PortfolioPositionDTO> positions = positionService.getActiveUserPositions(userId);
        return ResponseEntity.ok(positions);
    }
}