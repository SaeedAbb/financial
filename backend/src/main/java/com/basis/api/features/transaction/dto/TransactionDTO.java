package com.basis.api.features.transaction.dto;

import com.basis.api.features.transaction.TransactionCategory;
import com.basis.api.features.transaction.TransactionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionDTO {
    private Long id;
    private UUID uuid;
    private String userId;
    private TransactionCategory transactionCategory;
    private TransactionType transactionType;
    private Long referenceId;
    private String referenceType;
    private String symbol;
    private BigDecimal quantity;
    private BigDecimal pricePerUnit;
    private BigDecimal totalAmount;
    private BigDecimal fees;
    private BigDecimal netAmount;
    private LocalDate transactionDate;
    private String notes;
    private ZonedDateTime createdAt;
}
