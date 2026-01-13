package com.basis.api.features.statement.dto;

import com.basis.api.features.statement.ImportStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.ZonedDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImportResultDTO {

    private UUID batchId;
    private ImportStatus status;
    private Integer totalTransactions;
    private Integer successCount;
    private Integer failureCount;
    private Integer duplicateCount;
    private ZonedDateTime createdAt;
    private ZonedDateTime completedAt;
    private List<TransactionImportResultDTO> results;
    private String errorMessage;

    // Static factory for success
    public static ImportResultDTO success(UUID batchId, int totalTransactions, int successCount,
                                          List<TransactionImportResultDTO> results) {
        return ImportResultDTO.builder()
                .batchId(batchId)
                .status(successCount == totalTransactions ? ImportStatus.COMPLETED : ImportStatus.PARTIALLY_COMPLETED)
                .totalTransactions(totalTransactions)
                .successCount(successCount)
                .failureCount(totalTransactions - successCount)
                .duplicateCount(0)
                .results(results)
                .createdAt(ZonedDateTime.now())
                .completedAt(ZonedDateTime.now())
                .build();
    }

    // Static factory for success with duplicate count
    public static ImportResultDTO success(UUID batchId, int totalTransactions, int successCount,
                                          int duplicateCount, List<TransactionImportResultDTO> results) {
        return ImportResultDTO.builder()
                .batchId(batchId)
                .status((successCount + duplicateCount) == totalTransactions ? ImportStatus.COMPLETED : ImportStatus.PARTIALLY_COMPLETED)
                .totalTransactions(totalTransactions)
                .successCount(successCount)
                .failureCount(totalTransactions - successCount - duplicateCount)
                .duplicateCount(duplicateCount)
                .results(results)
                .createdAt(ZonedDateTime.now())
                .completedAt(ZonedDateTime.now())
                .build();
    }

    // Static factory for failure
    public static ImportResultDTO failure(UUID batchId, String errorMessage) {
        return ImportResultDTO.builder()
                .batchId(batchId)
                .status(ImportStatus.FAILED)
                .errorMessage(errorMessage)
                .createdAt(ZonedDateTime.now())
                .completedAt(ZonedDateTime.now())
                .build();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TransactionImportResultDTO {
        private Long transactionId;
        private UUID transactionUuid;
        private boolean success;
        private boolean duplicate;
        private String ticker;
        private String errorMessage;

        // Static factory for success
        public static TransactionImportResultDTO success(Long transactionId, UUID transactionUuid, String ticker) {
            return TransactionImportResultDTO.builder()
                    .transactionId(transactionId)
                    .transactionUuid(transactionUuid)
                    .ticker(ticker)
                    .success(true)
                    .build();
        }

        // Static factory for failure
        public static TransactionImportResultDTO failure(String errorMessage) {
            return TransactionImportResultDTO.builder()
                    .success(false)
                    .errorMessage(errorMessage)
                    .build();
        }

        // Static factory for duplicate
        public static TransactionImportResultDTO duplicate(String ticker) {
            return TransactionImportResultDTO.builder()
                    .success(false)
                    .duplicate(true)
                    .ticker(ticker)
                    .errorMessage("Transaction already exists (duplicate)")
                    .build();
        }
    }
}
