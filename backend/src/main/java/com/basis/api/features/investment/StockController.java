package com.basis.api.features.investment;

import com.basis.api.features.investment.dto.BuyStockRequest;
import com.basis.api.features.investment.dto.SellStockRequest;
import com.basis.api.features.investment.dto.StockDTO;
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
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/stocks")
@Tag(name = "Stocks", description = "Stock transaction management endpoints")
@SecurityRequirement(name = "bearer-key")
public class StockController {

    private static final Logger logger = LoggerFactory.getLogger(StockController.class);
    
    private final StockService stockService;

    public StockController(StockService stockService) {
        this.stockService = stockService;
    }

    @PostMapping("/buy")
    @Operation(summary = "Buy a stock", description = "Buys a stock and adds it to the specified portfolio")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Stock purchased successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input data"),
            @ApiResponse(responseCode = "404", description = "Portfolio not found"),
            @ApiResponse(responseCode = "401", description = "User not authenticated")
    })
    public ResponseEntity<StockDTO> buyStock(
            @Valid @RequestBody BuyStockRequest request,
            Authentication authentication) {
        
        String userId = getUserId(authentication);
        logger.info("Buying stock {} for user: {}", request.getSymbol(), userId);
        
        StockDTO stock = stockService.buyStock(userId, request);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(stock);
    }

    @PostMapping("/sell")
    @Operation(summary = "Sell a stock (partial or full)", 
               description = "Sells a specified quantity of stock from the user's portfolio. If quantity is null or exceeds available quantity, all available shares are sold.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Stock sold successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input data, insufficient quantity, or stock already fully sold"),
            @ApiResponse(responseCode = "404", description = "Stock not found"),
            @ApiResponse(responseCode = "401", description = "User not authenticated")
    })
    public ResponseEntity<StockDTO> sellStock(
            @Valid @RequestBody SellStockRequest request,
            Authentication authentication) {
        
        String userId = getUserId(authentication);
        logger.info("Selling stock with UUID: {} for user: {}", request.getStockUuid(), userId);
        
        StockDTO stock = stockService.sellStock(userId, request);
        
        return ResponseEntity.ok(stock);
    }

    @GetMapping("/portfolio/{portfolioUuid}")
    @Operation(summary = "Get stocks in portfolio", description = "Retrieves all stocks in a specific portfolio")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Stocks retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "Portfolio not found"),
            @ApiResponse(responseCode = "401", description = "User not authenticated")
    })
    public ResponseEntity<List<StockDTO>> getPortfolioStocks(
            @PathVariable @Parameter(description = "Portfolio UUID") UUID portfolioUuid,
            Authentication authentication) {
        
        String userId = getUserId(authentication);
        logger.debug("Fetching stocks for portfolio UUID: {} and user: {}", portfolioUuid, userId);
        
        List<StockDTO> stocks = stockService.getPortfolioStocks(userId, portfolioUuid);
        
        return ResponseEntity.ok(stocks);
    }

    @GetMapping("/portfolio/{portfolioUuid}/paginated")
    @Operation(summary = "Get stocks in portfolio with pagination", description = "Retrieves stocks in a specific portfolio with pagination")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Stocks retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "Portfolio not found"),
            @ApiResponse(responseCode = "401", description = "User not authenticated")
    })
    public ResponseEntity<Page<StockDTO>> getPortfolioStocksPaginated(
            @PathVariable @Parameter(description = "Portfolio UUID") UUID portfolioUuid,
            @RequestParam(defaultValue = "0") @Parameter(description = "Page number") int page,
            @RequestParam(defaultValue = "10") @Parameter(description = "Page size") int size,
            @RequestParam(defaultValue = "purchaseDate") @Parameter(description = "Sort field") String sortBy,
            @RequestParam(defaultValue = "desc") @Parameter(description = "Sort direction") String sortDir,
            Authentication authentication) {
        
        String userId = getUserId(authentication);
        logger.debug("Fetching stocks for portfolio UUID: {} and user: {} (page: {}, size: {})", 
                portfolioUuid, userId, page, size);
        
        Page<StockDTO> stocks = stockService.getPortfolioStocks(userId, portfolioUuid, page, size, sortBy, sortDir);
        
        return ResponseEntity.ok(stocks);
    }

    @GetMapping("/portfolio/{portfolioUuid}/active")
    @Operation(summary = "Get active stocks in portfolio", description = "Retrieves only active stocks in a specific portfolio")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Active stocks retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "Portfolio not found"),
            @ApiResponse(responseCode = "401", description = "User not authenticated")
    })
    public ResponseEntity<List<StockDTO>> getActivePortfolioStocks(
            @PathVariable @Parameter(description = "Portfolio UUID") UUID portfolioUuid,
            Authentication authentication) {
        
        String userId = getUserId(authentication);
        logger.debug("Fetching active stocks for portfolio UUID: {} and user: {}", portfolioUuid, userId);
        
        List<StockDTO> stocks = stockService.getActivePortfolioStocks(userId, portfolioUuid);
        
        return ResponseEntity.ok(stocks);
    }

    @GetMapping("/portfolio/{portfolioUuid}/sold")
    @Operation(summary = "Get sold stocks in portfolio", description = "Retrieves only sold stocks in a specific portfolio")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Sold stocks retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "Portfolio not found"),
            @ApiResponse(responseCode = "401", description = "User not authenticated")
    })
    public ResponseEntity<List<StockDTO>> getSoldPortfolioStocks(
            @PathVariable @Parameter(description = "Portfolio UUID") UUID portfolioUuid,
            Authentication authentication) {
        
        String userId = getUserId(authentication);
        logger.debug("Fetching sold stocks for portfolio UUID: {} and user: {}", portfolioUuid, userId);
        
        List<StockDTO> stocks = stockService.getSoldPortfolioStocks(userId, portfolioUuid);
        
        return ResponseEntity.ok(stocks);
    }

    @GetMapping("/{uuid}")
    @Operation(summary = "Get stock by UUID", description = "Retrieves a specific stock by its UUID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Stock retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "Stock not found"),
            @ApiResponse(responseCode = "401", description = "User not authenticated")
    })
    public ResponseEntity<StockDTO> getStockByUuid(
            @PathVariable @Parameter(description = "Stock UUID") UUID uuid,
            Authentication authentication) {
        
        String userId = getUserId(authentication);
        logger.debug("Fetching stock with UUID: {} for user: {}", uuid, userId);
        
        StockDTO stock = stockService.getStockByUuid(userId, uuid);
        
        return ResponseEntity.ok(stock);
    }

    @GetMapping("/symbol/{symbol}")
    @Operation(summary = "Get stocks by symbol", description = "Retrieves all stocks for a specific symbol across all user's portfolios")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Stocks retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "User not authenticated")
    })
    public ResponseEntity<List<StockDTO>> getStocksBySymbol(
            @PathVariable @Parameter(description = "Stock symbol") String symbol,
            Authentication authentication) {
        
        String userId = getUserId(authentication);
        logger.debug("Fetching stocks with symbol: {} for user: {}", symbol, userId);
        
        List<StockDTO> stocks = stockService.getStocksBySymbol(userId, symbol);
        
        return ResponseEntity.ok(stocks);
    }

    @GetMapping("/date-range")
    @Operation(summary = "Get stocks by date range", description = "Retrieves stocks purchased within a specific date range")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Stocks retrieved successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid date range"),
            @ApiResponse(responseCode = "401", description = "User not authenticated")
    })
    public ResponseEntity<List<StockDTO>> getStocksInDateRange(
            @RequestParam @Parameter(description = "Start date (YYYY-MM-DD)") 
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @Parameter(description = "End date (YYYY-MM-DD)") 
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            Authentication authentication) {
        
        String userId = getUserId(authentication);
        logger.debug("Fetching stocks for user: {} between {} and {}", userId, startDate, endDate);
        
        List<StockDTO> stocks = stockService.getStocksInDateRange(userId, startDate, endDate);
        
        return ResponseEntity.ok(stocks);
    }

    @GetMapping("/symbols")
    @Operation(summary = "Get distinct stock symbols", description = "Retrieves all distinct stock symbols for the user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Stock symbols retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "User not authenticated")
    })
    public ResponseEntity<List<String>> getDistinctSymbols(Authentication authentication) {
        String userId = getUserId(authentication);
        logger.debug("Fetching distinct stock symbols for user: {}", userId);
        
        List<String> symbols = stockService.getDistinctSymbols(userId);
        
        return ResponseEntity.ok(symbols);
    }

    @GetMapping("/summary")
    @Operation(summary = "Get stocks summary", description = "Gets summary statistics for all user's stocks")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Summary retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "User not authenticated")
    })
    public ResponseEntity<Map<String, Object>> getStocksSummary(Authentication authentication) {
        String userId = getUserId(authentication);
        logger.debug("Fetching stocks summary for user: {}", userId);
        
        Map<String, Object> summary = new HashMap<>();
        summary.put("totalStocks", stockService.getStocksCount(userId));
        summary.put("totalInvestment", stockService.getTotalInvestmentValue(userId));
        summary.put("totalGainLoss", stockService.getTotalGainLoss(userId));
        summary.put("distinctSymbols", stockService.getDistinctSymbols(userId).size());
        
        BigDecimal totalInvestment = stockService.getTotalInvestmentValue(userId);
        BigDecimal totalGainLoss = stockService.getTotalGainLoss(userId);
        
        if (totalInvestment != null && totalInvestment.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal gainLossPercentage = totalGainLoss
                    .divide(totalInvestment, 4, java.math.RoundingMode.HALF_UP)
                    .multiply(new BigDecimal("100"));
            summary.put("totalGainLossPercentage", gainLossPercentage);
        } else {
            summary.put("totalGainLossPercentage", BigDecimal.ZERO);
        }
        
        return ResponseEntity.ok(summary);
    }

    @DeleteMapping("/{uuid}")
    @Operation(summary = "Delete stock", description = "Deletes a stock (administrative function - normally stocks are sold)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Stock deleted successfully"),
            @ApiResponse(responseCode = "404", description = "Stock not found"),
            @ApiResponse(responseCode = "401", description = "User not authenticated")
    })
    public ResponseEntity<Void> deleteStock(
            @PathVariable @Parameter(description = "Stock UUID") UUID uuid,
            Authentication authentication) {
        
        String userId = getUserId(authentication);
        logger.info("Deleting stock with UUID: {} for user: {}", uuid, userId);
        
        stockService.deleteStock(userId, uuid);
        
        return ResponseEntity.noContent().build();
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