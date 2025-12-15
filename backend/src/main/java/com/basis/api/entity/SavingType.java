package com.basis.api.entity;

public enum SavingType {
    CASH("Cash"),
    GOLD("Gold"),
    OTHER("Other");

    private final String displayName;

    SavingType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}