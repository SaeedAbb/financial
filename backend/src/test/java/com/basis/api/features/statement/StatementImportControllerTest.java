package com.basis.api.features.statement;

import com.basis.api.features.statement.dto.ImportTransactionDTO;
import com.basis.api.features.statement.dto.ParsePdfResponseDTO;
import com.basis.api.features.statement.providers.StatementProvider;
import com.basis.api.features.statement.services.StatementImportService;
import com.basis.api.features.statement.services.StatementParsingService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith({SpringExtension.class, MockitoExtension.class})
@WebMvcTest(StatementImportController.class)
@WithMockUser
class StatementImportControllerTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @MockBean
    private StatementImportService importService;
    
    @MockBean
    private StatementParsingService parsingService;
    
    @Test
    void testParsePdfEndpoint_Success() throws Exception {
        // Given
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "statement.pdf",
            "application/pdf",
            "PDF content".getBytes()
        );
        
        ParsePdfResponseDTO mockResponse = new ParsePdfResponseDTO(
            StatementProvider.TRADE_REPUBLIC, 
            Arrays.asList(new ImportTransactionDTO())
        );
        mockResponse.setFileName("statement.pdf");
        
        when(parsingService.parsePdfStatement(any(), eq(StatementProvider.TRADE_REPUBLIC)))
            .thenReturn(mockResponse);
        
        // When & Then
        mockMvc.perform(multipart("/api/v1/statement-import/parse-pdf")
                .file(file)
                .param("provider", "TRADE_REPUBLIC")
                .with(csrf()))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.provider").value("TRADE_REPUBLIC"))
            .andExpect(jsonPath("$.fileName").value("statement.pdf"))
            .andExpect(jsonPath("$.transactions").isArray())
            .andExpect(jsonPath("$.transactions").isNotEmpty());
    }
    
    @Test
    void testParsePdfEndpoint_EmptyFile() throws Exception {
        // Given
        MockMultipartFile emptyFile = new MockMultipartFile(
            "file",
            "empty.pdf",
            "application/pdf",
            new byte[0]
        );
        
        // When & Then
        mockMvc.perform(multipart("/api/v1/statement-import/parse-pdf")
                .file(emptyFile)
                .param("provider", "TRADE_REPUBLIC")
                .with(csrf()))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.message").value("File is empty"));
    }
    
    @Test
    void testParsePdfEndpoint_NonPdfFile() throws Exception {
        // Given
        MockMultipartFile textFile = new MockMultipartFile(
            "file",
            "document.txt",
            "text/plain",
            "Not a PDF".getBytes()
        );
        
        // When & Then
        mockMvc.perform(multipart("/api/v1/statement-import/parse-pdf")
                .file(textFile)
                .param("provider", "TRADE_REPUBLIC")
                .with(csrf()))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.message").value("File must be a PDF"));
    }
    
    @Test
    void testParsePdfEndpoint_ParsingError() throws Exception {
        // Given
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "statement.pdf",
            "application/pdf",
            "PDF content".getBytes()
        );
        
        ParsePdfResponseDTO errorResponse = new ParsePdfResponseDTO("Parsing failed");
        
        when(parsingService.parsePdfStatement(any(), eq(StatementProvider.DEUTSCHE_BANK)))
            .thenReturn(errorResponse);
        
        // When & Then
        mockMvc.perform(multipart("/api/v1/statement-import/parse-pdf")
                .file(file)
                .param("provider", "DEUTSCHE_BANK")
                .with(csrf()))
            .andExpect(status().isUnprocessableEntity())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.message").value("Parsing failed"));
    }
    
    @Test
    void testParsePdfEndpoint_AllProviders() throws Exception {
        // Test each provider to ensure they're all handled
        for (StatementProvider provider : StatementProvider.values()) {
            MockMultipartFile file = new MockMultipartFile(
                "file",
                "statement.pdf",
                "application/pdf",
                "PDF content".getBytes()
            );
            
            ParsePdfResponseDTO mockResponse = new ParsePdfResponseDTO(
                provider, 
                Arrays.asList()
            );
            
            when(parsingService.parsePdfStatement(any(), eq(provider)))
                .thenReturn(mockResponse);
            
            mockMvc.perform(multipart("/api/v1/statement-import/parse-pdf")
                    .file(file)
                    .param("provider", provider.name())
                    .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.provider").value(provider.name()));
        }
    }
    
    @Test
    @WithMockUser(username = "testuser")
    void testParsePdfEndpoint_WithAuthentication() throws Exception {
        // Given
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "statement.pdf",
            "application/pdf",
            "PDF content".getBytes()
        );
        
        ParsePdfResponseDTO mockResponse = new ParsePdfResponseDTO(
            StatementProvider.TRADE_REPUBLIC, 
            Arrays.asList()
        );
        
        when(parsingService.parsePdfStatement(any(), any()))
            .thenReturn(mockResponse);
        
        // When & Then
        mockMvc.perform(multipart("/api/v1/statement-import/parse-pdf")
                .file(file)
                .param("provider", "TRADE_REPUBLIC")
                .with(csrf()))
            .andExpect(status().isOk());
    }
}