package com.basis.api.features.transaction;

public enum TransactionCategory {
    STOCK("Stock trading transactions"),
    CRYPTO("Cryptocurrency transactions"),
    FOREX("Foreign exchange transactions"),
    COMMODITY("Commodity trading transactions"),
    BOND("Bond transactions"),
    ETF("Exchange-traded fund transactions"),
    MUTUAL_FUND("Mutual fund transactions"),
    OPTION("Options trading transactions");

    private final String description;

    TransactionCategory(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}