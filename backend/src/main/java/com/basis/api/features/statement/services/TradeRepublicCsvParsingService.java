package com.basis.api.features.statement.services;

import com.basis.api.features.statement.dto.ImportTransactionDTO;
import com.basis.api.features.statement.dto.ParseStatementResponseDTO;
import com.basis.api.features.statement.providers.StatementProvider;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStreamReader;
import java.io.Reader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Parses Trade Republic "Transaktionsexport" CSV files into the shared
 * {@link ImportTransactionDTO} format consumed by {@link StatementImportService}.
 *
 * <p>This service is intentionally separate from the AI/PDF-based
 * {@link StatementParsingService}: CSV is a fully structured format that can
 * be parsed deterministically, with no LLM round-trip and predictable output.</p>
 *
 * <h3>What we keep</h3>
 * Only TRADING BUY/SELL rows for the STOCK asset class are emitted.
 * Funds/ETFs, cash movements (deposits, dividends, tax optimisations, stock
 * perks) and cryptocurrency trades are filtered out — they don't change a
 * portfolio's stock positions and are out of scope for this importer.
 *
 * <h3>Trade Republic CSV column reference</h3>
 * {@code datetime, date, account_type, category, type, asset_class, name,
 * symbol, shares, price, amount, fee, tax, currency, original_amount,
 * original_currency, fx_rate, description, transaction_id, ...}
 *
 * <p>Note: Trade Republic's {@code symbol} column actually holds the ISIN
 * (e.g. {@code US88160R1014}) — we map it to {@link ImportTransactionDTO#getIsin()}
 * and use the {@code name} column as the human-readable description.</p>
 */
@Service
public class TradeRepublicCsvParsingService {

    private static final Logger logger = LoggerFactory.getLogger(TradeRepublicCsvParsingService.class);

    private static final Pattern ISIN_PATTERN = Pattern.compile("^[A-Z]{2}[A-Z0-9]{9}[0-9]$");

    private static final String CATEGORY_TRADING = "TRADING";
    private static final Set<String> SUPPORTED_TYPES = Set.of("BUY", "SELL");
    private static final Set<String> SUPPORTED_ASSET_CLASSES = Set.of("STOCK");

    private static final String COL_DATE = "date";
    private static final String COL_CATEGORY = "category";
    private static final String COL_TYPE = "type";
    private static final String COL_ASSET_CLASS = "asset_class";
    private static final String COL_NAME = "name";
    private static final String COL_SYMBOL = "symbol";
    private static final String COL_SHARES = "shares";
    private static final String COL_PRICE = "price";
    private static final String COL_AMOUNT = "amount";
    private static final String COL_FEE = "fee";
    private static final String COL_CURRENCY = "currency";
    private static final String COL_TRANSACTION_ID = "transaction_id";

    public ParseStatementResponseDTO parseCsvStatement(MultipartFile file, StatementProvider provider) {
        if (provider != StatementProvider.TRADE_REPUBLIC) {
            return ParseStatementResponseDTO.failure(
                    "CSV import is only supported for Trade Republic at this time");
        }

        ParseCounters counters = new ParseCounters();
        List<ImportTransactionDTO> transactions = new ArrayList<>();

        CSVFormat format = CSVFormat.RFC4180.builder()
                .setHeader()
                .setSkipHeaderRecord(true)
                .setIgnoreEmptyLines(true)
                .setTrim(true)
                .build();

        try (Reader reader = new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8);
             CSVParser parser = new CSVParser(reader, format)) {

            for (CSVRecord record : parser) {
                counters.totalRows++;
                Optional<ImportTransactionDTO> mapped = mapRow(record, counters);
                mapped.ifPresent(transactions::add);
            }

        } catch (Exception e) {
            logger.error("Failed to parse Trade Republic CSV: {}", file.getOriginalFilename(), e);
            return ParseStatementResponseDTO.failure(
                    "Failed to parse CSV file: " + e.getMessage());
        }

        logger.info("Parsed Trade Republic CSV '{}': {} rows total, {} imported, "
                        + "{} skipped (filter), {} skipped (errors)",
                file.getOriginalFilename(), counters.totalRows, transactions.size(),
                counters.skippedByFilter, counters.skippedByError);

        return ParseStatementResponseDTO.success(
                provider, transactions, file.getOriginalFilename(), counters.toMetadata());
    }

    /**
     * Maps a single CSV row to an {@link ImportTransactionDTO}, or skips it
     * when the row doesn't represent an importable trade. All filtering and
     * sign-normalisation lives here so {@link #parseCsvStatement} stays a
     * thin streaming loop.
     */
    private Optional<ImportTransactionDTO> mapRow(CSVRecord record, ParseCounters counters) {
        String category = record.get(COL_CATEGORY);
        String type = record.get(COL_TYPE);
        String assetClass = record.get(COL_ASSET_CLASS);

        if (!CATEGORY_TRADING.equalsIgnoreCase(category)
                || !SUPPORTED_TYPES.contains(type.toUpperCase())
                || !SUPPORTED_ASSET_CLASSES.contains(assetClass.toUpperCase())) {
            counters.skippedByFilter++;
            return Optional.empty();
        }

        try {
            String name = record.get(COL_NAME);
            String rawIsin = record.get(COL_SYMBOL);

            ImportTransactionDTO dto = ImportTransactionDTO.builder()
                    .date(LocalDate.parse(record.get(COL_DATE)))
                    .type(type.toUpperCase())
                    .description(name)
                    .quantity(parsePositiveDecimal(record.get(COL_SHARES)))
                    .pricePerUnit(parsePositiveDecimal(record.get(COL_PRICE)))
                    .totalAmount(parsePositiveDecimal(record.get(COL_AMOUNT)))
                    .fees(parsePositiveDecimalOrZero(record.get(COL_FEE)))
                    .currency(record.get(COL_CURRENCY))
                    .rawSymbol(name)
                    .isin(extractIsin(rawIsin))
                    .providerReference(record.get(COL_TRANSACTION_ID))
                    .build();

            return Optional.of(dto);

        } catch (Exception e) {
            counters.skippedByError++;
            logger.warn("Skipping Trade Republic CSV row {} due to parse error: {}",
                    record.getRecordNumber(), e.getMessage());
            return Optional.empty();
        }
    }

    private static String extractIsin(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String trimmed = value.trim();
        return ISIN_PATTERN.matcher(trimmed).matches() ? trimmed : null;
    }

    private static BigDecimal parsePositiveDecimal(String value) {
        return new BigDecimal(value).abs();
    }

    private static BigDecimal parsePositiveDecimalOrZero(String value) {
        if (value == null || value.isBlank()) {
            return BigDecimal.ZERO;
        }
        return new BigDecimal(value).abs();
    }

    /**
     * Internal counter bag — lets {@link #mapRow} stay pure-ish and centralises
     * what shows up in the response metadata.
     */
    private static final class ParseCounters {
        int totalRows;
        int skippedByFilter;
        int skippedByError;

        Map<String, Object> toMetadata() {
            Map<String, Object> metadata = new HashMap<>();
            metadata.put("totalRows", totalRows);
            metadata.put("skippedByFilter", skippedByFilter);
            metadata.put("skippedByError", skippedByError);
            metadata.put("imported", totalRows - skippedByFilter - skippedByError);
            return metadata;
        }
    }
}
