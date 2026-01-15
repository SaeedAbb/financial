package com.basis.api.features.integration.finnhub.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO for Finnhub API stock profile response
 * API endpoint: /stock/profile2
 */
@Data
@NoArgsConstructor
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
}
