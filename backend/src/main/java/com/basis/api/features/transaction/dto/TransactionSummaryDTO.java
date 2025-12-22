package com.basis.api.features.transaction.dto;

import com.basis.api.features.transaction.TransactionCategory;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

public class TransactionSummaryDTO {
    private String userId;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal totalBuyAmount;
    private BigDecimal totalSellAmount;
    private BigDecimal totalFees;
    private BigDecimal netGainLoss;
    private Map<TransactionCategory, Long> transactionCountByCategory = new HashMap<>();

    // Default constructor
    public TransactionSummaryDTO() {}

    // Helper method
    public void addCategoryCount(TransactionCategory category, Long count) {
        transactionCountByCategory.put(category, count);
    }

    // Getters and setters
    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public BigDecimal getTotalBuyAmount() {
        return totalBuyAmount;
    }

    public void setTotalBuyAmount(BigDecimal totalBuyAmount) {
        this.totalBuyAmount = totalBuyAmount;
    }

    public BigDecimal getTotalSellAmount() {
        return totalSellAmount;
    }

    public void setTotalSellAmount(BigDecimal totalSellAmount) {
        this.totalSellAmount = totalSellAmount;
    }

    public BigDecimal getTotalFees() {
        return totalFees;
    }

    public void setTotalFees(BigDecimal totalFees) {
        this.totalFees = totalFees;
    }

    public BigDecimal getNetGainLoss() {
        return netGainLoss;
    }

    public void setNetGainLoss(BigDecimal netGainLoss) {
        this.netGainLoss = netGainLoss;
    }

    public Map<TransactionCategory, Long> getTransactionCountByCategory() {
        return transactionCountByCategory;
    }

    public void setTransactionCountByCategory(Map<TransactionCategory, Long> transactionCountByCategory) {
        this.transactionCountByCategory = transactionCountByCategory;
    }
}