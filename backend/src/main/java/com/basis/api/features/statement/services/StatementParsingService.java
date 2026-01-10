package com.basis.api.features.statement.services;

import com.basis.api.features.statement.dto.ImportTransactionDTO;
import com.basis.api.features.statement.dto.ParsePdfResponseDTO;
import com.basis.api.features.statement.providers.StatementProvider;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.genai.Client;
import com.google.genai.types.GenerateContentResponse;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.io.RandomAccessReadBuffer;
import org.apache.pdfbox.text.PDFTextStripper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Statement parsing service using direct Google Gemini API.
 * This implementation uses the Google GenAI SDK for cleaner integration.
 * 
 * Currently supports: Stocks and ETFs only
 * 
 * TODO: Future features will include support for:
 * - Cryptocurrency transactions (Bitcoin, Ethereum, etc.)
 * - Dividend payments
 * - Options trading
 * - Bonds and other fixed-income securities
 */
@Service
public class StatementParsingService {
    
    private static final Logger logger = LoggerFactory.getLogger(StatementParsingService.class);
    
    private final Client geminiClient;
    private final ObjectMapper objectMapper;
    private final String modelName;
    
    public StatementParsingService(
            @Value("${gemini.api.key:#{null}}") String apiKey,
            @Value("${gemini.model:gemini-1.5-flash}") String modelName,
            ObjectMapper objectMapper) {
        
        this.objectMapper = objectMapper;
        this.modelName = modelName;
        
        // Initialize Gemini client
        if (apiKey != null && !apiKey.isEmpty()) {
            this.geminiClient = Client.builder()
                    .apiKey(apiKey)
                    .build();
            logger.info("Gemini client initialized with API key");
        } else {
            // Try to use default client which will look for GOOGLE_API_KEY env var
            this.geminiClient = new Client();
            logger.info("Gemini client initialized with environment variable");
        }
        
        // Try to list available models for debugging
        try {
            logger.info("Attempting to list available Gemini models...");
            var modelsPager = geminiClient.models.list(null);
            // Try to access the models through the pager
            if (modelsPager != null) {
                // The pager might have a different method or property
                logger.info("Models pager type: {}", modelsPager.getClass().getName());
                // For now, let's skip the detailed listing
            }
        } catch (Exception e) {
            logger.warn("Could not list available models: {}", e.getMessage());
        }
    }
    
    public ParsePdfResponseDTO parsePdfStatement(MultipartFile file, StatementProvider provider) {
        try {
            // Extract text from PDF
            String pdfText = extractTextFromPdf(file);
            
            // Create prompt based on provider
            String prompt = createPromptForProvider(provider, pdfText);
            
            // Call Gemini API
            String responseContent = callGeminiApi(prompt);
            
            // Parse the JSON response
            List<ImportTransactionDTO> transactions = parseGeminiResponse(responseContent);
            
            // Create response
            ParsePdfResponseDTO result = new ParsePdfResponseDTO(provider, transactions);
            result.setFileName(file.getOriginalFilename());
            
            Map<String, Object> metadata = new HashMap<>();
            metadata.put("parsedAt", LocalDate.now());
            metadata.put("totalTransactions", transactions.size());
            metadata.put("model", modelName);
            result.setMetadata(metadata);
            
            logger.info("Successfully parsed {} transactions from {} statement using {}", 
                transactions.size(), provider, modelName);
            
            return result;
            
        } catch (Exception e) {
            logger.error("Error parsing PDF statement: ", e);
            return new ParsePdfResponseDTO("Failed to parse PDF: " + e.getMessage());
        }
    }
    
    protected String callGeminiApi(String prompt) throws Exception {
        try {
            // Call Gemini API directly with text prompt
            logger.debug("Using model: {}", modelName);
            
            GenerateContentResponse response = geminiClient.models
                    .generateContent(modelName, prompt, null);
            
            // Extract text from response
            String responseText = response.text();
            
            logger.debug("Gemini API response length: {} characters", responseText.length());
            
            return responseText;
            
        } catch (Exception e) {
            logger.error("Error calling Gemini API: ", e);
            throw new RuntimeException("Failed to call Gemini API: " + e.getMessage(), e);
        }
    }
    
    protected String extractTextFromPdf(MultipartFile file) throws IOException {
        try (PDDocument document = Loader.loadPDF(new RandomAccessReadBuffer(file.getInputStream()))) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        }
    }
    
    private String createPromptForProvider(StatementProvider provider, String pdfText) {
        String basePrompt = """
            You are an expert financial document parser. Extract all stock/ETF transactions from the following %s statement.
            
            Return ONLY a JSON array of transactions with this EXACT format:
            [
              {
                "date": "YYYY-MM-DD",
                "type": "BUY" or "SELL",
                "description": "original transaction description",
                "quantity": numeric_value,
                "pricePerUnit": numeric_value,
                "totalAmount": numeric_value,
                "fees": numeric_value (default 0),
                "currency": "EUR" or "USD" etc,
                "rawSymbol": "stock symbol as shown",
                "isin": "12-character ISIN if available",
                "providerReference": "transaction ID if available"
              }
            ]
            
            Important rules:
            1. Only include BUY and SELL transactions (no dividends, fees, deposits, withdrawals)
            2. EXCLUDE any entries labeled as "Barmittelübersicht" or "Transaktionsübersicht" - these are summaries, not actual transactions
            3. EXCLUDE cash movements, account balances, or overview sections
            4. Only include actual stock/ETF purchase or sale transactions
            5. EXCLUDE cryptocurrency transactions (Bitcoin, Ethereum, etc.) - these are not yet supported
            6. quantity must be positive decimal (minimum 0.000001)
            7. pricePerUnit must be positive decimal (minimum 0.01)
            8. totalAmount must equal quantity * pricePerUnit + fees
            9. ISIN must be exactly 12 characters (2 letters + 9 alphanumeric + 1 digit) or null
            10. Dates must be in YYYY-MM-DD format
            11. Currency must be 3-letter ISO code
            12. Return ONLY the JSON array, no other text
            
            Statement text:
            %s
            """;
        
        String providerSpecificInstructions = getProviderSpecificInstructions(provider);
        
        return String.format(basePrompt, provider.name(), pdfText) + "\n\n" + providerSpecificInstructions;
    }
    
    private String getProviderSpecificInstructions(StatementProvider provider) {
        return switch (provider) {
            case TRADE_REPUBLIC -> """
                Trade Republic specific instructions:
                - Look for "Ausführung" or "Execution" sections
                - Transaction types: "Kauf" = BUY, "Verkauf" = SELL
                - ISIN is usually shown after the stock name
                - Symbol might be in format like "IE00B4L5Y983" (which is actually the ISIN)
                - Fees are often shown as "Fremdkostenzuschlag" or similar
                - IGNORE sections labeled "Barmittelübersicht" (cash overview) or "Transaktionsübersicht" (transaction summary)
                - IGNORE entries that are just account balances or cash movements
                - IGNORE cryptocurrency transactions (Bitcoin, BTC, Ethereum, ETH, etc.)
                """;
                
            case DEUTSCHE_BANK -> """
                Deutsche Bank specific instructions:
                - Look for "Wertpapierabrechnung" sections
                - Transaction types: "Kauf" = BUY, "Verkauf" = SELL
                - ISIN and WKN are usually listed separately
                - Total amount includes "Kurswert" + "Provision" + other fees
                - IGNORE overview sections like "Barmittelübersicht" or "Transaktionsübersicht"
                """;
                
            case ING_DIBA -> """
                ING DiBa specific instructions:
                - Look for "Wertpapier-Abrechnung" sections
                - Clear separation between "Kauf" and "Verkauf"
                - ISIN is prominently displayed
                - Multiple fee items may need to be summed
                - IGNORE summary sections and cash overviews
                """;
                
            case COMDIRECT -> """
                Comdirect specific instructions:
                - Look for "Wertpapierabrechnung" headers
                - Transaction details in structured tables
                - ISIN/WKN clearly labeled
                - Fees itemized separately
                - IGNORE account overview and summary sections
                """;
                
            default -> "";
        };
    }
    
    private List<ImportTransactionDTO> parseGeminiResponse(String responseContent) throws Exception {
        try {
            // Clean the response - remove any markdown formatting if present
            String cleanedResponse = responseContent.trim();
            if (cleanedResponse.startsWith("```json")) {
                cleanedResponse = cleanedResponse.substring(7);
            }
            if (cleanedResponse.endsWith("```")) {
                cleanedResponse = cleanedResponse.substring(0, cleanedResponse.length() - 3);
            }
            cleanedResponse = cleanedResponse.trim();
            
            // Parse JSON array
            List<Map<String, Object>> rawTransactions = objectMapper.readValue(
                cleanedResponse, 
                new TypeReference<List<Map<String, Object>>>() {}
            );
            
            // Convert to DTOs
            List<ImportTransactionDTO> transactions = new ArrayList<>();
            DateTimeFormatter formatter = DateTimeFormatter.ISO_LOCAL_DATE;
            
            for (Map<String, Object> raw : rawTransactions) {
                ImportTransactionDTO dto = new ImportTransactionDTO();
                
                // Parse date
                String dateStr = (String) raw.get("date");
                dto.setDate(LocalDate.parse(dateStr, formatter));
                
                // Parse type
                String typeStr = ((String) raw.get("type")).toUpperCase();
                dto.setType(typeStr);
                
                // String fields
                dto.setDescription((String) raw.get("description"));
                dto.setCurrency((String) raw.get("currency"));
                dto.setRawSymbol((String) raw.get("rawSymbol"));
                dto.setIsin((String) raw.get("isin"));
                dto.setProviderReference((String) raw.get("providerReference"));
                
                // Numeric fields - handle different number types
                dto.setQuantity(parseBigDecimal(raw.get("quantity")));
                dto.setPricePerUnit(parseBigDecimal(raw.get("pricePerUnit")));
                dto.setTotalAmount(parseBigDecimal(raw.get("totalAmount")));
                dto.setFees(parseBigDecimal(raw.get("fees")));
                
                transactions.add(dto);
            }
            
            return transactions;
            
        } catch (Exception e) {
            logger.error("Failed to parse Gemini response: {}", responseContent, e);
            throw new RuntimeException("Failed to parse AI response: " + e.getMessage(), e);
        }
    }
    
    private BigDecimal parseBigDecimal(Object value) {
        if (value == null) return BigDecimal.ZERO;
        if (value instanceof Number) {
            return BigDecimal.valueOf(((Number) value).doubleValue()).setScale(6, RoundingMode.HALF_UP);
        }
        if (value instanceof String) {
            return new BigDecimal((String) value).setScale(6, RoundingMode.HALF_UP);
        }
        throw new IllegalArgumentException("Cannot parse BigDecimal from: " + value);
    }
}