package com.basis.api.features.transaction.dto;

import com.basis.api.features.transaction.TransactionCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionSummaryDTO {
    private String userId;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal totalBuyAmount;
    private BigDecimal totalSellAmount;
    private BigDecimal totalFees;
    private BigDecimal netGainLoss;

    @Builder.Default
    private Map<TransactionCategory, Long> transactionCountByCategory = new HashMap<>();

    public void addCategoryCount(TransactionCategory category, Long count) {
        transactionCountByCategory.put(category, count);
    }
}
