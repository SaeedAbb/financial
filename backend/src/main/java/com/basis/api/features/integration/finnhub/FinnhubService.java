package com.basis.api.features.integration.finnhub;

import com.basis.api.features.integration.finnhub.dto.FinnhubStockProfileDTO;
import com.basis.api.features.integration.finnhub.exception.FinnhubApiException;
import com.basis.api.features.stock.master.MarketCapCategory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

/**
 * Service layer for Finnhub integration
 * Handles business logic and caching
 */
@Service
public class FinnhubService {
    
    private static final Logger logger = LoggerFactory.getLogger(FinnhubService.class);
    
    private final FinnhubClient finnhubClient;
    
    public FinnhubService(FinnhubClient finnhubClient) {
        this.finnhubClient = finnhubClient;
    }
    
    /**
     * Get stock profile by ISIN with caching
     * @param isin The ISIN to look up
     * @return Stock profile data
     * @throws FinnhubApiException if lookup fails
     */
    @Cacheable(value = "finnhubStockProfiles", key = "#isin", unless = "#result == null")
    public FinnhubStockProfileDTO getStockProfile(String isin) {
        if (isin == null || isin.trim().isEmpty()) {
            throw new IllegalArgumentException("ISIN cannot be null or empty");
        }
        
        // Validate ISIN format
        if (!isValidIsin(isin)) {
            throw new IllegalArgumentException("Invalid ISIN format: " + isin);
        }
        
        try {
            return finnhubClient.getStockProfile(isin);
        } catch (FinnhubApiException e) {
            // Re-throw API exceptions
            throw e;
        } catch (Exception e) {
            // Wrap unexpected exceptions
            logger.error("Unexpected error getting stock profile for ISIN: {}", isin, e);
            throw new FinnhubApiException("Failed to get stock profile: " + e.getMessage(), e);
        }
    }
    
    /**
     * Calculate market cap category from market capitalization value
     * @param marketCap Market capitalization in millions
     * @return Market cap category
     */
    public MarketCapCategory calculateMarketCapCategory(BigDecimal marketCap) {
        if (marketCap == null) {
            return null;
        }
        
        // Convert to billions for easier comparison
        BigDecimal billions = marketCap.divide(BigDecimal.valueOf(1000));
        
        if (billions.compareTo(BigDecimal.valueOf(200)) > 0) {
            return MarketCapCategory.MEGA;
        } else if (billions.compareTo(BigDecimal.valueOf(10)) > 0) {
            return MarketCapCategory.LARGE;
        } else if (billions.compareTo(BigDecimal.valueOf(2)) > 0) {
            return MarketCapCategory.MID;
        } else if (marketCap.compareTo(BigDecimal.valueOf(300)) > 0) {
            return MarketCapCategory.SMALL;
        } else if (marketCap.compareTo(BigDecimal.valueOf(50)) > 0) {
            return MarketCapCategory.MICRO;
        } else {
            return MarketCapCategory.NANO;
        }
    }
    
    /**
     * Validate ISIN format
     * @param isin The ISIN to validate
     * @return true if valid ISIN format
     */
    private boolean isValidIsin(String isin) {
        // ISIN format: 2 letter country code + 9 alphanumeric + 1 check digit
        return isin != null && isin.matches("^[A-Z]{2}[A-Z0-9]{9}[0-9]$");
    }
}