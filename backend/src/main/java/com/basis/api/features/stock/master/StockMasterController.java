package com.basis.api.features.stock.master;

import com.basis.api.features.stock.master.dto.CreateStockMasterRequest;
import com.basis.api.features.stock.master.dto.StockMasterDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/stocks/master")
@Tag(name = "Stock Master", description = "Stock master data management endpoints")
public class StockMasterController {

    private final StockMasterService stockMasterService;

    public StockMasterController(StockMasterService stockMasterService) {
        this.stockMasterService = stockMasterService;
    }

    @PostMapping
    @Operation(summary = "Create a new stock", description = "Add a new stock to the master list")
    public ResponseEntity<StockMasterDTO> createStock(@Valid @RequestBody CreateStockMasterRequest request) {
        StockMasterDTO stock = stockMasterService.createStock(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(stock);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get stock by ID", description = "Retrieve stock information by its ID")
    public ResponseEntity<StockMasterDTO> getStock(
            @PathVariable @Parameter(description = "Stock ID") Long id) {
        StockMasterDTO stock = stockMasterService.getStockById(id);
        return ResponseEntity.ok(stock);
    }

    @GetMapping("/symbol/{symbol}")
    @Operation(summary = "Get stock by symbol", description = "Retrieve stock information by its symbol")
    public ResponseEntity<StockMasterDTO> getStockBySymbol(
            @PathVariable @Parameter(description = "Stock symbol") String symbol) {
        StockMasterDTO stock = stockMasterService.getStockBySymbol(symbol);
        return ResponseEntity.ok(stock);
    }

    @GetMapping
    @Operation(summary = "Get all stocks", description = "Retrieve all stocks from the master list")
    public ResponseEntity<List<StockMasterDTO>> getAllStocks() {
        List<StockMasterDTO> stocks = stockMasterService.getAllStocks();
        return ResponseEntity.ok(stocks);
    }

    @GetMapping("/search")
    @Operation(summary = "Search stocks", description = "Search stocks by symbol or company name")
    public ResponseEntity<List<StockMasterDTO>> searchStocks(
            @RequestParam @Parameter(description = "Search term") String search) {
        List<StockMasterDTO> stocks = stockMasterService.searchStocks(search);
        return ResponseEntity.ok(stocks);
    }

    @GetMapping("/exchange/{exchange}")
    @Operation(summary = "Get stocks by exchange", description = "Retrieve all stocks from a specific exchange")
    public ResponseEntity<List<StockMasterDTO>> getStocksByExchange(
            @PathVariable @Parameter(description = "Exchange name") String exchange) {
        List<StockMasterDTO> stocks = stockMasterService.getStocksByExchange(exchange);
        return ResponseEntity.ok(stocks);
    }

    @GetMapping("/sector/{sector}")
    @Operation(summary = "Get stocks by sector", description = "Retrieve all stocks from a specific sector")
    public ResponseEntity<List<StockMasterDTO>> getStocksBySector(
            @PathVariable @Parameter(description = "Sector name") String sector) {
        List<StockMasterDTO> stocks = stockMasterService.getStocksBySector(sector);
        return ResponseEntity.ok(stocks);
    }

    @GetMapping("/sectors")
    @Operation(summary = "Get all sectors", description = "Retrieve list of all available sectors")
    public ResponseEntity<List<String>> getAllSectors() {
        List<String> sectors = stockMasterService.getAllSectors();
        return ResponseEntity.ok(sectors);
    }

    @GetMapping("/exchanges")
    @Operation(summary = "Get all exchanges", description = "Retrieve list of all available exchanges")
    public ResponseEntity<List<String>> getAllExchanges() {
        List<String> exchanges = stockMasterService.getAllExchanges();
        return ResponseEntity.ok(exchanges);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update stock", description = "Update stock information")
    public ResponseEntity<StockMasterDTO> updateStock(
            @PathVariable @Parameter(description = "Stock ID") Long id,
            @Valid @RequestBody CreateStockMasterRequest request) {
        StockMasterDTO stock = stockMasterService.updateStock(id, request);
        return ResponseEntity.ok(stock);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete stock", description = "Delete a stock from the master list")
    public ResponseEntity<Void> deleteStock(
            @PathVariable @Parameter(description = "Stock ID") Long id) {
        stockMasterService.deleteStock(id);
        return ResponseEntity.noContent().build();
    }
}