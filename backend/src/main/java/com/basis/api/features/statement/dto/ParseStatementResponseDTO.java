package com.basis.api.features.statement.dto;

import com.basis.api.features.statement.providers.StatementProvider;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * Generic response payload for statement-parsing endpoints. Used by both
 * the deterministic CSV parser and (eventually) the AI-based PDF parser.
 *
 * <p>The structure is intentionally identical to {@code ParsePdfResponseDTO}
 * but the name is format-agnostic so that callers (CSV, future XLSX, etc.)
 * can share a single response contract.</p>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParseStatementResponseDTO {

    @Builder.Default
    private boolean success = true;

    private StatementProvider provider;
    private List<ImportTransactionDTO> transactions;
    private String fileName;
    private Map<String, Object> metadata;
    private String message;

    public static ParseStatementResponseDTO success(StatementProvider provider,
                                                    List<ImportTransactionDTO> transactions,
                                                    String fileName,
                                                    Map<String, Object> metadata) {
        return ParseStatementResponseDTO.builder()
                .success(true)
                .provider(provider)
                .transactions(transactions)
                .fileName(fileName)
                .metadata(metadata)
                .build();
    }

    public static ParseStatementResponseDTO failure(String message) {
        return ParseStatementResponseDTO.builder()
                .success(false)
                .message(message)
                .build();
    }
}
