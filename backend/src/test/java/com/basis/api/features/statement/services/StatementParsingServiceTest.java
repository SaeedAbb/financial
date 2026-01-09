package com.basis.api.features.statement.services;

import com.basis.api.features.statement.dto.ImportTransactionDTO;
import com.basis.api.features.statement.dto.ParsePdfResponseDTO;
import com.basis.api.features.statement.providers.StatementProvider;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(MockitoExtension.class)
class StatementParsingServiceTest {
    
    private StatementParsingService parsingService;
    private ObjectMapper objectMapper;
    private String lastPrompt;
    private String mockResponse;
    
    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        
        // Create a test implementation that captures prompts and returns mock responses
        // Use a dummy API key for testing since we're overriding the actual API call
        parsingService = new StatementParsingService("test-api-key", "gemini-1.5-flash", objectMapper) {
            @Override
            protected String callGeminiApi(String prompt) throws Exception {
                lastPrompt = prompt;
                if (mockResponse != null) {
                    return mockResponse;
                }
                throw new RuntimeException("No mock response set");
            }
            
            @Override
            protected String extractTextFromPdf(MultipartFile file) throws IOException {
                // Return the content as text for testing
                return new String(file.getBytes());
            }
        };
    }
    
    @Test
    void testParsePdfStatement_Success() throws Exception {
        // Given
        String pdfContent = "Trade Republic Statement - Buy 10 shares of Apple";
        MultipartFile mockFile = new MockMultipartFile(
            "statement.pdf", 
            "statement.pdf", 
            "application/pdf", 
            pdfContent.getBytes()
        );
        
        mockResponse = """
            [
              {
                "date": "2024-01-15",
                "type": "BUY",
                "description": "Apple Inc.",
                "quantity": 10,
                "pricePerUnit": 150.50,
                "totalAmount": 1505.00,
                "fees": 1.00,
                "currency": "USD",
                "rawSymbol": "AAPL",
                "isin": "US0378331005",
                "providerReference": "TR-123456"
              }
            ]
            """;
        
        // When
        ParsePdfResponseDTO result = parsingService.parsePdfStatement(mockFile, StatementProvider.TRADE_REPUBLIC);
        
        // Then
        assertThat(result.isSuccess()).isTrue();
        assertThat(result.getProvider()).isEqualTo(StatementProvider.TRADE_REPUBLIC);
        assertThat(result.getTransactions()).hasSize(1);
        
        ImportTransactionDTO transaction = result.getTransactions().get(0);
        assertThat(transaction.getDate()).isEqualTo(LocalDate.of(2024, 1, 15));
        assertThat(transaction.getType()).isEqualTo("BUY");
        assertThat(transaction.getDescription()).isEqualTo("Apple Inc.");
        assertThat(transaction.getQuantity()).isEqualByComparingTo(new BigDecimal("10"));
        assertThat(transaction.getPricePerUnit()).isEqualByComparingTo(new BigDecimal("150.50"));
        assertThat(transaction.getTotalAmount()).isEqualByComparingTo(new BigDecimal("1505.00"));
        assertThat(transaction.getFees()).isEqualByComparingTo(new BigDecimal("1.00"));
        assertThat(transaction.getCurrency()).isEqualTo("USD");
        assertThat(transaction.getRawSymbol()).isEqualTo("AAPL");
        assertThat(transaction.getIsin()).isEqualTo("US0378331005");
        assertThat(transaction.getProviderReference()).isEqualTo("TR-123456");
        
        assertThat(result.getFileName()).isEqualTo("statement.pdf");
        assertThat(result.getMetadata()).containsKey("totalTransactions");
        assertThat(result.getMetadata().get("totalTransactions")).isEqualTo(1);
        assertThat(result.getMetadata().get("model")).isEqualTo("gemini-1.5-flash");
        
        // Verify prompt contains provider info
        assertThat(lastPrompt).contains("TRADE_REPUBLIC");
    }
    
    @Test
    void testParsePdfStatement_MultipleTransactions() throws Exception {
        // Given
        String pdfContent = "Statement with multiple transactions";
        MultipartFile mockFile = new MockMultipartFile(
            "statement.pdf", 
            "statement.pdf", 
            "application/pdf", 
            pdfContent.getBytes()
        );
        
        mockResponse = """
            [
              {
                "date": "2024-01-10",
                "type": "BUY",
                "description": "Microsoft Corp",
                "quantity": 5,
                "pricePerUnit": 300.00,
                "totalAmount": 1501.00,
                "fees": 1.00,
                "currency": "USD",
                "rawSymbol": "MSFT",
                "isin": "US5949181045",
                "providerReference": "DB-111"
              },
              {
                "date": "2024-01-12",
                "type": "SELL",
                "description": "Amazon.com Inc",
                "quantity": 10,
                "pricePerUnit": 150.00,
                "totalAmount": 1498.50,
                "fees": 1.50,
                "currency": "USD",
                "rawSymbol": "AMZN",
                "isin": "US0231351067",
                "providerReference": "DB-112"
              }
            ]
            """;
        
        // When
        ParsePdfResponseDTO result = parsingService.parsePdfStatement(mockFile, StatementProvider.DEUTSCHE_BANK);
        
        // Then
        assertThat(result.isSuccess()).isTrue();
        assertThat(result.getTransactions()).hasSize(2);
        assertThat(result.getTransactions().get(0).getType()).isEqualTo("BUY");
        assertThat(result.getTransactions().get(1).getType()).isEqualTo("SELL");
    }
    
    @Test
    void testParsePdfStatement_HandlesMarkdownFormatting() throws Exception {
        // Given
        String pdfContent = "Statement content";
        MultipartFile mockFile = new MockMultipartFile(
            "statement.pdf", 
            "statement.pdf", 
            "application/pdf", 
            pdfContent.getBytes()
        );
        
        // Response with markdown formatting
        mockResponse = """
            ```json
            [
              {
                "date": "2024-01-15",
                "type": "BUY",
                "description": "Tesla Inc",
                "quantity": 2,
                "pricePerUnit": 200.00,
                "totalAmount": 401.00,
                "fees": 1.00,
                "currency": "USD",
                "rawSymbol": "TSLA",
                "isin": "US88160R1014",
                "providerReference": "ING-999"
              }
            ]
            ```
            """;
        
        // When
        ParsePdfResponseDTO result = parsingService.parsePdfStatement(mockFile, StatementProvider.ING_DIBA);
        
        // Then
        assertThat(result.isSuccess()).isTrue();
        assertThat(result.getTransactions()).hasSize(1);
        assertThat(result.getTransactions().get(0).getRawSymbol()).isEqualTo("TSLA");
    }
    
    @Test
    void testParsePdfStatement_ErrorHandling() throws Exception {
        // Given
        MultipartFile mockFile = new MockMultipartFile(
            "statement.pdf", 
            "statement.pdf", 
            "application/pdf", 
            "content".getBytes()
        );
        
        // Don't set mockResponse to trigger error
        mockResponse = null;
        
        // When
        ParsePdfResponseDTO result = parsingService.parsePdfStatement(mockFile, StatementProvider.TRADE_REPUBLIC);
        
        // Then
        assertThat(result.isSuccess()).isFalse();
        assertThat(result.getMessage()).contains("Failed to parse PDF");
        assertThat(result.getTransactions()).isNull();
    }
    
    @Test
    void testParsePdfStatement_InvalidJsonResponse() throws Exception {
        // Given
        String pdfContent = "Statement content";
        MultipartFile mockFile = new MockMultipartFile(
            "statement.pdf", 
            "statement.pdf", 
            "application/pdf", 
            pdfContent.getBytes()
        );
        
        mockResponse = "This is not valid JSON";
        
        // When
        ParsePdfResponseDTO result = parsingService.parsePdfStatement(mockFile, StatementProvider.TRADE_REPUBLIC);
        
        // Then
        assertThat(result.isSuccess()).isFalse();
        assertThat(result.getMessage()).contains("Failed to parse PDF");
    }
    
    @Test
    void testProviderSpecificPrompts() throws Exception {
        // Given
        String pdfContent = "Provider specific content";
        MultipartFile mockFile = new MockMultipartFile(
            "statement.pdf", 
            "statement.pdf", 
            "application/pdf", 
            pdfContent.getBytes()
        );
        
        mockResponse = "[]"; // Empty transactions
        
        // Test each provider
        for (StatementProvider provider : StatementProvider.values()) {
            // When
            ParsePdfResponseDTO result = parsingService.parsePdfStatement(mockFile, provider);
            
            // Then
            assertThat(result.isSuccess()).isTrue();
            assertThat(result.getProvider()).isEqualTo(provider);
            
            // Verify provider name appears in prompt
            assertThat(lastPrompt).contains(provider.name());
        }
    }
}