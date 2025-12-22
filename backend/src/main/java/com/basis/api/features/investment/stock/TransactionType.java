package com.basis.api.features.investment.stock;

public enum TransactionType {
    BUY("BUY"),
    SELL("SELL");

    private final String value;

    TransactionType(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    @Override
    public String toString() {
        return value;
    }
}