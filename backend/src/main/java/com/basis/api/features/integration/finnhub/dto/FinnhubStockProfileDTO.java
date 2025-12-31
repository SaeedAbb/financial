package com.basis.api.features.integration.finnhub.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;

/**
 * DTO for Finnhub API stock profile response
 * API endpoint: /stock/profile2
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class FinnhubStockProfileDTO {
    
    private String country;
    private String currency;
    
    @JsonProperty("estimateCurrency")
    private String estimateCurrency;
    
    private String exchange;
    
    @JsonProperty("finnhubIndustry")
    private String finnhubIndustry;
    
    private String ipo;
    private String logo;
    
    @JsonProperty("marketCapitalization")
    private BigDecimal marketCapitalization;
    
    private String name;
    private String phone;
    
    @JsonProperty("shareOutstanding")
    private BigDecimal shareOutstanding;
    
    private String ticker;
    
    @JsonProperty("weburl")
    private String weburl;
    
    // Default constructor
    public FinnhubStockProfileDTO() {}
    
    // Getters and setters
    public String getCountry() {
        return country;
    }
    
    public void setCountry(String country) {
        this.country = country;
    }
    
    public String getCurrency() {
        return currency;
    }
    
    public void setCurrency(String currency) {
        this.currency = currency;
    }
    
    public String getEstimateCurrency() {
        return estimateCurrency;
    }
    
    public void setEstimateCurrency(String estimateCurrency) {
        this.estimateCurrency = estimateCurrency;
    }
    
    public String getExchange() {
        return exchange;
    }
    
    public void setExchange(String exchange) {
        this.exchange = exchange;
    }
    
    public String getFinnhubIndustry() {
        return finnhubIndustry;
    }
    
    public void setFinnhubIndustry(String finnhubIndustry) {
        this.finnhubIndustry = finnhubIndustry;
    }
    
    public String getIpo() {
        return ipo;
    }
    
    public void setIpo(String ipo) {
        this.ipo = ipo;
    }
    
    public String getLogo() {
        return logo;
    }
    
    public void setLogo(String logo) {
        this.logo = logo;
    }
    
    public BigDecimal getMarketCapitalization() {
        return marketCapitalization;
    }
    
    public void setMarketCapitalization(BigDecimal marketCapitalization) {
        this.marketCapitalization = marketCapitalization;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public String getPhone() {
        return phone;
    }
    
    public void setPhone(String phone) {
        this.phone = phone;
    }
    
    public BigDecimal getShareOutstanding() {
        return shareOutstanding;
    }
    
    public void setShareOutstanding(BigDecimal shareOutstanding) {
        this.shareOutstanding = shareOutstanding;
    }
    
    public String getTicker() {
        return ticker;
    }
    
    public void setTicker(String ticker) {
        this.ticker = ticker;
    }
    
    public String getWeburl() {
        return weburl;
    }
    
    public void setWeburl(String weburl) {
        this.weburl = weburl;
    }
    
    @Override
    public String toString() {
        return "FinnhubStockProfileDTO{" +
                "ticker='" + ticker + '\'' +
                ", name='" + name + '\'' +
                ", exchange='" + exchange + '\'' +
                ", industry='" + finnhubIndustry + '\'' +
                ", marketCap=" + marketCapitalization +
                '}';
    }
}