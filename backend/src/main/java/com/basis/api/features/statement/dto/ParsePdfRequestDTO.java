package com.basis.api.features.statement.dto;

import com.basis.api.features.statement.providers.StatementProvider;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ParsePdfRequestDTO {

    @NotNull(message = "PDF file is required")
    private MultipartFile file;

    @NotNull(message = "Provider is required")
    private StatementProvider provider;
}
