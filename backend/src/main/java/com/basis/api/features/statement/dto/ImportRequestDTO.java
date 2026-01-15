package com.basis.api.features.statement.dto;

import com.basis.api.features.statement.providers.StatementProvider;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImportRequestDTO {

    @NotNull(message = "Provider is required")
    private StatementProvider provider;

    @NotNull(message = "Portfolio UUID is required")
    private UUID portfolioId;

    @NotNull(message = "Transactions cannot be null")
    @NotEmpty(message = "At least one transaction is required")
    @Valid
    private List<ImportTransactionDTO> transactions;

    private String fileName;

    private Map<String, Object> providerMetadata;
}
