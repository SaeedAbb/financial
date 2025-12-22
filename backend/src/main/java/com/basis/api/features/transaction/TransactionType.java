package com.basis.api.features.transaction;

public enum TransactionType {
    BUY("Purchase of assets"),
    SELL("Sale of assets"),
    DIVIDEND("Dividend payment received"),
    FEE("Transaction or management fee"),
    SPLIT("Stock split"),
    MERGER("Merger or acquisition"),
    TRANSFER_IN("Transfer into account"),
    TRANSFER_OUT("Transfer out of account"),
    INTEREST("Interest payment"),
    TAX("Tax payment or withholding");

    private final String description;

    TransactionType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }

    public boolean isInflow() {
        return this == BUY || this == TRANSFER_IN;
    }

    public boolean isOutflow() {
        return this == SELL || this == TRANSFER_OUT || this == FEE || this == TAX;
    }

    public boolean isNeutral() {
        return this == SPLIT || this == MERGER;
    }

    public boolean isIncome() {
        return this == DIVIDEND || this == INTEREST;
    }
}