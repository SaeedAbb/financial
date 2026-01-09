package com.basis.api.features.statement.dto;

import com.basis.api.features.statement.providers.StatementProvider;
import jakarta.validation.constraints.NotNull;
import org.springframework.web.multipart.MultipartFile;

public class ParsePdfRequestDTO {
    
    @NotNull(message = "PDF file is required")
    private MultipartFile file;
    
    @NotNull(message = "Provider is required")
    private StatementProvider provider;
    
    // Constructor
    public ParsePdfRequestDTO() {}
    
    // Getters and Setters
    public MultipartFile getFile() {
        return file;
    }
    
    public void setFile(MultipartFile file) {
        this.file = file;
    }
    
    public StatementProvider getProvider() {
        return provider;
    }
    
    public void setProvider(StatementProvider provider) {
        this.provider = provider;
    }
}