package com.basis.api.features.integration.finnhub;

import com.basis.api.features.integration.finnhub.dto.FinnhubStockProfileDTO;
import com.basis.api.features.integration.finnhub.exception.FinnhubApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.Duration;

/**
 * HTTP Client for Finnhub API
 * Handles low-level API communication
 */
@Component
public class FinnhubClient {
    
    private static final Logger logger = LoggerFactory.getLogger(FinnhubClient.class);
    
    @Value("${finnhub.api-key}")
    private String apiKey;
    
    @Value("${finnhub.base-url:https://finnhub.io/api/v1}")
    private String baseUrl;
    
    private final RestTemplate restTemplate;
    
    public FinnhubClient(RestTemplateBuilder restTemplateBuilder) {
        this.restTemplate = restTemplateBuilder
                .setConnectTimeout(Duration.ofSeconds(5))
                .setReadTimeout(Duration.ofSeconds(10))
                .build();
    }
    
    /**
     * Get stock profile by ISIN
     * @param isin The ISIN to look up
     * @return Stock profile data
     * @throws FinnhubApiException if API call fails
     */
    public FinnhubStockProfileDTO getStockProfile(String isin) {
        String url = UriComponentsBuilder.fromHttpUrl(baseUrl)
                .path("/stock/profile2")
                .queryParam("symbol", isin)
                .queryParam("token", apiKey)
                .toUriString();
        
        logger.debug("Calling Finnhub API: {}", url.replace(apiKey, "***"));
        
        try {
            ResponseEntity<FinnhubStockProfileDTO> response = restTemplate.getForEntity(
                    url, 
                    FinnhubStockProfileDTO.class
            );
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                FinnhubStockProfileDTO profile = response.getBody();
                
                // Check if we got a valid response with ticker
                if (profile.getTicker() == null || profile.getTicker().isEmpty()) {
                    logger.warn("Finnhub returned empty profile for ISIN: {}", isin);
                    throw new FinnhubApiException("No stock data found for ISIN: " + isin, 404);
                }
                
                logger.info("Successfully retrieved stock profile for ISIN: {} -> Ticker: {}", 
                        isin, profile.getTicker());
                return profile;
            } else {
                throw new FinnhubApiException(
                        "Unexpected response from Finnhub API", 
                        response.getStatusCode().value()
                );
            }
            
        } catch (HttpClientErrorException e) {
            logger.error("Finnhub API error for ISIN {}: {} - {}", 
                    isin, e.getStatusCode(), e.getResponseBodyAsString());
            
            if (e.getStatusCode() == HttpStatus.NOT_FOUND) {
                throw new FinnhubApiException(
                        "Stock not found for ISIN: " + isin, 
                        404,
                        e.getResponseBodyAsString()
                );
            } else if (e.getStatusCode() == HttpStatus.TOO_MANY_REQUESTS) {
                throw new FinnhubApiException(
                        "Finnhub API rate limit exceeded", 
                        429,
                        e.getResponseBodyAsString()
                );
            } else if (e.getStatusCode() == HttpStatus.UNAUTHORIZED) {
                throw new FinnhubApiException(
                        "Invalid Finnhub API key", 
                        401,
                        e.getResponseBodyAsString()
                );
            }
            
            throw new FinnhubApiException(
                    "Finnhub API error: " + e.getMessage(), 
                    e.getStatusCode().value(),
                    e.getResponseBodyAsString()
            );
            
        } catch (RestClientException e) {
            logger.error("Error calling Finnhub API for ISIN {}: {}", isin, e.getMessage());
            throw new FinnhubApiException("Failed to connect to Finnhub API: " + e.getMessage(), e);
        }
    }
}