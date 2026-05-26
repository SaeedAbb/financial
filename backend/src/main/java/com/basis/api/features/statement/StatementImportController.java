package com.basis.api.features.statement;

import com.basis.api.features.statement.dto.ImportRequestDTO;
import com.basis.api.features.statement.dto.ImportResultDTO;
import com.basis.api.features.statement.dto.ParsePdfRequestDTO;
import com.basis.api.features.statement.dto.ParsePdfResponseDTO;
import com.basis.api.features.statement.dto.ParseStatementResponseDTO;
import com.basis.api.features.statement.providers.StatementProvider;
import com.basis.api.features.statement.services.StatementImportService;
import com.basis.api.features.statement.services.StatementParsingService;
import com.basis.api.features.statement.services.TradeRepublicCsvParsingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.ZonedDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/statement-import")
@Tag(name = "Statement Import", description = "Import bank/broker statements")
public class StatementImportController {
    
    private final StatementImportService importService;
    private final StatementParsingService parsingService;
    private final TradeRepublicCsvParsingService csvParsingService;

    public StatementImportController(StatementImportService importService,
                                     StatementParsingService parsingService,
                                     TradeRepublicCsvParsingService csvParsingService) {
        this.importService = importService;
        this.parsingService = parsingService;
        this.csvParsingService = csvParsingService;
    }
    
    @PostMapping("/portfolio/{portfolioUuid}/import")
    @Operation(summary = "Import transactions from parsed statement")
    public ResponseEntity<ImportResultDTO> importTransactions(
            @PathVariable UUID portfolioUuid,
            @Valid @RequestBody ImportRequestDTO importRequest,
            Authentication authentication) {

        String userId = authentication.getName();
        importRequest.setPortfolioId(portfolioUuid);

        ImportResultDTO result = importService.importTransactions(userId, importRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }
    
    @PostMapping(value = "/parse-pdf", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Parse PDF statement using AI to extract transactions")
    public ResponseEntity<ParsePdfResponseDTO> parsePdfStatement(
            @RequestParam("file") MultipartFile file,
            @RequestParam("provider") StatementProvider provider,
            Authentication authentication) {
        
        if (file.isEmpty()) {
            return ResponseEntity.badRequest()
                .body(ParsePdfResponseDTO.failure("File is empty"));
        }

        if (!file.getContentType().equals("application/pdf")) {
            return ResponseEntity.badRequest()
                .body(ParsePdfResponseDTO.failure("File must be a PDF"));
        }
        
        ParsePdfResponseDTO result = parsingService.parsePdfStatement(file, provider);

        if (result.isSuccess()) {
            return ResponseEntity.ok(result);
        } else {
            return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(result);
        }
    }

    @PostMapping(value = "/parse-csv", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Parse a Trade Republic CSV transaction export to extract trades")
    public ResponseEntity<ParseStatementResponseDTO> parseCsvStatement(
            @RequestParam("file") MultipartFile file,
            @RequestParam("provider") StatementProvider provider,
            Authentication authentication) {

        if (file.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ParseStatementResponseDTO.failure("File is empty"));
        }

        if (!isCsvFile(file)) {
            return ResponseEntity.badRequest()
                    .body(ParseStatementResponseDTO.failure("File must be a CSV"));
        }

        ParseStatementResponseDTO result = csvParsingService.parseCsvStatement(file, provider);

        if (result.isSuccess()) {
            return ResponseEntity.ok(result);
        } else {
            return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(result);
        }
    }

    /**
     * Browsers report inconsistent MIME types for CSV files (text/csv,
     * application/csv, application/vnd.ms-excel, sometimes empty), so we
     * accept any MIME type as long as the filename ends in .csv.
     */
    private boolean isCsvFile(MultipartFile file) {
        String filename = file.getOriginalFilename();
        return filename != null && filename.toLowerCase().endsWith(".csv");
    }

    @GetMapping("/history")
    @Operation(summary = "Get import history for current user")
    public ResponseEntity<List<ImportBatch>> getImportHistory(Authentication authentication) {
        String userId = authentication.getName();
        List<ImportBatch> history = importService.getUserImportHistory(userId);
        return ResponseEntity.ok(history);
    }
    
    @GetMapping("/portfolio/{portfolioUuid}/history")
    @Operation(summary = "Get import history for specific portfolio")
    public ResponseEntity<List<ImportBatch>> getPortfolioImportHistory(
            @PathVariable UUID portfolioUuid,
            Authentication authentication) {

        String userId = authentication.getName();
        List<ImportBatch> history = importService.getPortfolioImportHistory(userId, portfolioUuid);
        return ResponseEntity.ok(history);
    }
    
    @GetMapping("/batch/{batchId}")
    @Operation(summary = "Get import batch details")
    public ResponseEntity<ImportBatch> getImportBatchDetails(
            @PathVariable UUID batchId,
            Authentication authentication) {
        
        String userId = authentication.getName();
        ImportBatch batch = importService.getImportBatchDetails(userId, batchId);
        return ResponseEntity.ok(batch);
    }
    
    @GetMapping("/statistics/{provider}")
    @Operation(summary = "Get import statistics for a provider")
    public ResponseEntity<Map<String, Object>> getProviderStatistics(
            @PathVariable StatementProvider provider,
            Authentication authentication) {
        
        String userId = authentication.getName();
        Map<String, Object> stats = importService.getProviderStatistics(userId, provider);
        return ResponseEntity.ok(stats);
    }
    
    @GetMapping("/providers")
    @Operation(summary = "Get list of supported providers")
    public ResponseEntity<List<Map<String, String>>> getSupportedProviders() {
        List<Map<String, String>> providers = importService.getSupportedProviders();
        return ResponseEntity.ok(providers);
    }
}