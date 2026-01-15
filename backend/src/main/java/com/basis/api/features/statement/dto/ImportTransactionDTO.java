package com.basis.api.features.statement.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImportTransactionDTO {

    @NotNull(message = "Transaction date is required")
    @PastOrPresent(message = "Transaction date cannot be in the future")
    private LocalDate date;

    @NotBlank(message = "Transaction type is required")
    @Pattern(regexp = "BUY|SELL", message = "Type must be BUY or SELL")
    private String type;

    @NotBlank(message = "Description is required")
    private String description;

    @NotNull(message = "Quantity is required")
    @DecimalMin(value = "0.000001", message = "Quantity must be positive")
    private BigDecimal quantity;

    @NotNull(message = "Price per unit is required")
    @DecimalMin(value = "0.01", message = "Price per unit must be positive")
    private BigDecimal pricePerUnit;

    @NotNull(message = "Total amount is required")
    private BigDecimal totalAmount;

    @DecimalMin(value = "0", message = "Fees cannot be negative")
    @Builder.Default
    private BigDecimal fees = BigDecimal.ZERO;

    @NotBlank(message = "Currency is required")
    private String currency;

    private String rawSymbol;

    @Pattern(regexp = "^[A-Z]{2}[A-Z0-9]{9}[0-9]$", message = "Invalid ISIN format")
    private String isin;

    private String providerReference;
}
