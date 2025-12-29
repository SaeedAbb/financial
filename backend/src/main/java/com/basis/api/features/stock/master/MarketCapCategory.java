package com.basis.api.features.stock.master;

public enum MarketCapCategory {
    MEGA("Over $200 billion"),
    LARGE("$10 billion to $200 billion"),
    MID("$2 billion to $10 billion"),
    SMALL("$300 million to $2 billion"),
    MICRO("$50 million to $300 million"),
    NANO("Under $50 million");

    private final String description;

    MarketCapCategory(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}