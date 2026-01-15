package com.basis.api.features.integration.finnhub.exception;

/**
 * Custom exception for Finnhub API errors
 */
public class FinnhubApiException extends RuntimeException {
    
    private final int statusCode;
    private final String apiResponse;
    
    public FinnhubApiException(String message) {
        super(message);
        this.statusCode = 0;
        this.apiResponse = null;
    }
    
    public FinnhubApiException(String message, int statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.apiResponse = null;
    }
    
    public FinnhubApiException(String message, int statusCode, String apiResponse) {
        super(message);
        this.statusCode = statusCode;
        this.apiResponse = apiResponse;
    }
    
    public FinnhubApiException(String message, Throwable cause) {
        super(message, cause);
        this.statusCode = 0;
        this.apiResponse = null;
    }
    
    public int getStatusCode() {
        return statusCode;
    }
    
    public String getApiResponse() {
        return apiResponse;
    }
}