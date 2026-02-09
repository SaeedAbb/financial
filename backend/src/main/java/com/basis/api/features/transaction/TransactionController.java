package com.basis.api.features.transaction;

import com.basis.api.features.transaction.dto.TransactionDTO;
import com.basis.api.features.transaction.dto.TransactionSummaryDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/transactions")
@Tag(name = "Transactions", description = "Transaction management endpoints")
public class TransactionController {

    private final TransactionService transactionService;

    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get transaction by ID", description = "Retrieve a specific transaction by ID")
    public ResponseEntity<TransactionDTO> getTransaction(
            @PathVariable @Parameter(description = "Transaction ID") Long id,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        TransactionDTO transaction = transactionService.getTransaction(id, userId);
        return ResponseEntity.ok(transaction);
    }

    @GetMapping("/uuid/{uuid}")
    @Operation(summary = "Get transaction by UUID", description = "Retrieve a specific transaction by UUID")
    public ResponseEntity<TransactionDTO> getTransactionByUuid(
            @PathVariable @Parameter(description = "Transaction UUID") UUID uuid,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        TransactionDTO transaction = transactionService.getTransactionByUuid(uuid, userId);
        return ResponseEntity.ok(transaction);
    }

    @GetMapping
    @Operation(summary = "Get all transactions", description = "Get all user transactions")
    public ResponseEntity<List<TransactionDTO>> getUserTransactions(
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        List<TransactionDTO> transactions = transactionService.getUserTransactions(userId);
        return ResponseEntity.ok(transactions);
    }

    @GetMapping("/paged")
    @Operation(summary = "Get transactions paged", description = "Get user transactions with pagination")
    public ResponseEntity<Page<TransactionDTO>> getUserTransactionsPaged(
            @PageableDefault(size = 20, sort = "transactionDate", direction = Sort.Direction.DESC) Pageable pageable,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        Page<TransactionDTO> transactions = transactionService.getUserTransactionsPaged(userId, pageable);
        return ResponseEntity.ok(transactions);
    }

    @GetMapping("/category/{category}")
    @Operation(summary = "Get transactions by category", description = "Get transactions filtered by category")
    public ResponseEntity<List<TransactionDTO>> getTransactionsByCategory(
            @PathVariable @Parameter(description = "Transaction category") TransactionCategory category,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        List<TransactionDTO> transactions = transactionService.getUserTransactionsByCategory(userId, category);
        return ResponseEntity.ok(transactions);
    }

    @GetMapping("/type/{type}")
    @Operation(summary = "Get transactions by type", description = "Get transactions filtered by type")
    public ResponseEntity<List<TransactionDTO>> getTransactionsByType(
            @PathVariable @Parameter(description = "Transaction type") TransactionType type,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        List<TransactionDTO> transactions = transactionService.getUserTransactionsByType(userId, type);
        return ResponseEntity.ok(transactions);
    }

    @GetMapping("/date-range")
    @Operation(summary = "Get transactions by date range", description = "Get transactions within a date range")
    public ResponseEntity<List<TransactionDTO>> getTransactionsByDateRange(
            @RequestParam @Parameter(description = "Start date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @Parameter(description = "End date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        List<TransactionDTO> transactions = transactionService.getUserTransactionsByDateRange(userId, startDate, endDate);
        return ResponseEntity.ok(transactions);
    }

    @GetMapping("/symbol/{symbol}")
    @Operation(summary = "Get transactions by symbol", description = "Get transactions for a specific symbol")
    public ResponseEntity<List<TransactionDTO>> getTransactionsBySymbol(
            @PathVariable @Parameter(description = "Symbol") String symbol,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        List<TransactionDTO> transactions = transactionService.getUserTransactionsBySymbol(userId, symbol);
        return ResponseEntity.ok(transactions);
    }

    @GetMapping("/position/{positionId}")
    @Operation(summary = "Get position transactions", description = "Get all transactions for a specific position")
    public ResponseEntity<List<TransactionDTO>> getPositionTransactions(
            @PathVariable @Parameter(description = "Position ID") Long positionId,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        List<TransactionDTO> transactions = transactionService.getPositionTransactions(positionId, userId);
        return ResponseEntity.ok(transactions);
    }

    @GetMapping("/portfolio/{portfolioId}")
    @Operation(summary = "Get portfolio transactions paged", description = "Get transactions for a specific portfolio with pagination")
    public ResponseEntity<Page<TransactionDTO>> getPortfolioTransactionsPaged(
            @PathVariable @Parameter(description = "Portfolio ID") Long portfolioId,
            @PageableDefault(size = 10, sort = "transactionDate", direction = Sort.Direction.DESC) Pageable pageable,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        Page<TransactionDTO> transactions = transactionService.getPortfolioTransactionsPaged(portfolioId, userId, pageable);
        return ResponseEntity.ok(transactions);
    }

    @GetMapping("/summary")
    @Operation(summary = "Get transaction summary", description = "Get transaction summary for date range")
    public ResponseEntity<TransactionSummaryDTO> getTransactionSummary(
            @RequestParam @Parameter(description = "Start date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @Parameter(description = "End date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        TransactionSummaryDTO summary = transactionService.getUserTransactionSummary(userId, startDate, endDate);
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/symbols")
    @Operation(summary = "Get user symbols", description = "Get distinct symbols for a category")
    public ResponseEntity<List<String>> getUserSymbols(
            @RequestParam @Parameter(description = "Transaction category") TransactionCategory category,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        List<String> symbols = transactionService.getUserSymbols(userId, category);
        return ResponseEntity.ok(symbols);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete transaction", description = "Delete a transaction (use with caution)")
    public ResponseEntity<Void> deleteTransaction(
            @PathVariable @Parameter(description = "Transaction ID") Long id,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        transactionService.deleteTransaction(id, userId);
        return ResponseEntity.noContent().build();
    }
}