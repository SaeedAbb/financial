package com.basis.api.features.statement.providers;

public enum StatementProvider {
    TRADE_REPUBLIC("Trade Republic", "TR"),
    DEUTSCHE_BANK("Deutsche Bank", "DB"),
    ING_DIBA("ING DiBa", "ING"),
    COMDIRECT("Comdirect", "CDT");
    
    private final String displayName;
    private final String code;
    
    StatementProvider(String displayName, String code) {
        this.displayName = displayName;
        this.code = code;
    }
    
    public String getDisplayName() {
        return displayName;
    }
    
    public String getCode() {
        return code;
    }
    
    public static StatementProvider fromCode(String code) {
        for (StatementProvider provider : values()) {
            if (provider.code.equalsIgnoreCase(code)) {
                return provider;
            }
        }
        throw new IllegalArgumentException("Unknown provider code: " + code);
    }
}