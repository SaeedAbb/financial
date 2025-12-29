package com.basis.api.features.investment.position;

public enum PositionStatus {
    ACTIVE("Currently holding shares"),
    CLOSED("All shares sold");

    private final String description;

    PositionStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}