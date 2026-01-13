package com.basis.api.features.statement.dto;

import com.basis.api.features.statement.providers.StatementProvider;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParsePdfResponseDTO {

    @Builder.Default
    private boolean success = true;

    private StatementProvider provider;
    private List<ImportTransactionDTO> transactions;
    private String fileName;
    private Map<String, Object> metadata;
    private String message;

    // Static factory for success
    public static ParsePdfResponseDTO success(StatementProvider provider, List<ImportTransactionDTO> transactions) {
        return ParsePdfResponseDTO.builder()
                .success(true)
                .provider(provider)
                .transactions(transactions)
                .build();
    }

    // Static factory for failure
    public static ParsePdfResponseDTO failure(String message) {
        return ParsePdfResponseDTO.builder()
                .success(false)
                .message(message)
                .build();
    }
}
