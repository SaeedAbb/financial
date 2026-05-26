package com.basis.api.features.statement.services;

import com.basis.api.features.statement.dto.ImportTransactionDTO;
import com.basis.api.features.statement.dto.ParseStatementResponseDTO;
import com.basis.api.features.statement.providers.StatementProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class TradeRepublicCsvParsingServiceTest {

    private static final String CSV_HEADER =
            "\"datetime\",\"date\",\"account_type\",\"category\",\"type\",\"asset_class\","
                    + "\"name\",\"symbol\",\"shares\",\"price\",\"amount\",\"fee\",\"tax\",\"currency\","
                    + "\"original_amount\",\"original_currency\",\"fx_rate\",\"description\","
                    + "\"transaction_id\",\"counterparty_name\",\"counterparty_iban\","
                    + "\"payment_reference\",\"mcc_code\"";

    private TradeRepublicCsvParsingService service;

    @BeforeEach
    void setUp() {
        service = new TradeRepublicCsvParsingService();
    }

    @Test
    void parsesStockBuyAndSell_andSkipsFundCashCryptoDividend() {
        String csv = csv(
                // STOCK BUY — should be imported
                row("2021-01-08T18:45:26Z", "2021-01-08", "TRADING", "BUY", "STOCK",
                        "Tesla", "US88160R1014", "1.0", "700.20", "-700.20", "-1.00", "EUR",
                        "tx-1"),
                // STOCK SELL — should be imported, sign-flipped to positive
                row("2021-08-13T09:12:36Z", "2021-08-13", "TRADING", "SELL", "STOCK",
                        "Apple", "US0378331005", "-2.0", "150.00", "300.00", "-1.00", "EUR",
                        "tx-2"),
                // FUND BUY — must be skipped (out of scope for now)
                row("2021-02-03T01:12:25Z", "2021-02-02", "TRADING", "BUY", "FUND",
                        "Core MSCI World USD (Acc)", "IE00B4L5Y983", "0.8071", "61.95",
                        "-50.00", "", "EUR", "tx-fund"),
                // DIVIDEND — must be skipped (CASH category)
                row("2021-05-14T03:27:58Z", "2021-05-14", "CASH", "DIVIDEND", "STOCK",
                        "Apple", "US0378331005", "2.0", "", "0.36", "", "EUR", "tx-3"),
                // CRYPTO BUY — must be skipped (asset_class)
                row("2021-06-14T13:24:39Z", "2021-06-14", "TRADING", "BUY", "CRYPTO",
                        "Ethereum", "ETH", "0.212", "2115.20", "-448.42", "-1.00", "EUR", "tx-4"),
                // CUSTOMER_INBOUND — must be skipped (CASH category)
                row("2021-01-08T18:20:37Z", "2021-01-08", "CASH", "CUSTOMER_INBOUND", "",
                        "HUDA CHIHAB", "", "", "", "1200.00", "", "EUR", "tx-5")
        );

        ParseStatementResponseDTO response = service.parseCsvStatement(
                multipart(csv), StatementProvider.TRADE_REPUBLIC);

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getTransactions()).hasSize(2);

        ImportTransactionDTO buy = response.getTransactions().get(0);
        assertThat(buy.getType()).isEqualTo("BUY");
        assertThat(buy.getDate()).isEqualTo(LocalDate.of(2021, 1, 8));
        assertThat(buy.getDescription()).isEqualTo("Tesla");
        assertThat(buy.getRawSymbol()).isEqualTo("Tesla");
        assertThat(buy.getIsin()).isEqualTo("US88160R1014");
        assertThat(buy.getQuantity()).isEqualByComparingTo("1.0");
        assertThat(buy.getPricePerUnit()).isEqualByComparingTo("700.20");
        assertThat(buy.getTotalAmount()).isEqualByComparingTo("700.20");
        assertThat(buy.getFees()).isEqualByComparingTo("1.00");
        assertThat(buy.getCurrency()).isEqualTo("EUR");
        assertThat(buy.getProviderReference()).isEqualTo("tx-1");

        ImportTransactionDTO sell = response.getTransactions().get(1);
        assertThat(sell.getType()).isEqualTo("SELL");
        assertThat(sell.getQuantity()).isEqualByComparingTo("2.0");
        assertThat(sell.getFees()).isEqualByComparingTo("1.00");
        assertThat(sell.getIsin()).isEqualTo("US0378331005");

        @SuppressWarnings("unchecked")
        Map<String, Object> metadata = response.getMetadata();
        assertThat(metadata.get("totalRows")).isEqualTo(6);
        assertThat(metadata.get("imported")).isEqualTo(2);
        assertThat(metadata.get("skippedByFilter")).isEqualTo(4);
    }

    @Test
    void leavesIsinNullWhenSymbolDoesNotMatchIsinFormat() {
        String csv = csv(
                row("2021-06-14T13:24:39Z", "2021-06-14", "TRADING", "BUY", "STOCK",
                        "Some Token", "ETH", "1.0", "10.00", "-10.00", "0.00", "EUR", "tx-x")
        );

        ParseStatementResponseDTO response = service.parseCsvStatement(
                multipart(csv), StatementProvider.TRADE_REPUBLIC);

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getTransactions()).hasSize(1);
        assertThat(response.getTransactions().get(0).getIsin()).isNull();
    }

    @Test
    void emptyFeeFieldDefaultsToZero() {
        String csv = csv(
                row("2021-02-03T01:12:25Z", "2021-02-02", "TRADING", "BUY", "STOCK",
                        "Tesla", "US88160R1014", "0.8071", "61.95",
                        "-50.00", "", "EUR", "tx-fee")
        );

        ParseStatementResponseDTO response = service.parseCsvStatement(
                multipart(csv), StatementProvider.TRADE_REPUBLIC);

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getTransactions()).hasSize(1);
        assertThat(response.getTransactions().get(0).getFees()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void rejectsNonTradeRepublicProvider() {
        String csv = csv(
                row("2021-01-08T18:45:26Z", "2021-01-08", "TRADING", "BUY", "STOCK",
                        "Tesla", "US88160R1014", "1.0", "700.20", "-700.20", "-1.00", "EUR",
                        "tx-1")
        );

        ParseStatementResponseDTO response = service.parseCsvStatement(
                multipart(csv), StatementProvider.DEUTSCHE_BANK);

        assertThat(response.isSuccess()).isFalse();
        assertThat(response.getMessage()).contains("Trade Republic");
    }

    @Test
    void malformedCsvReturnsFailureResponse() {
        // Header only with no rows is fine — parser should return empty transactions, not fail
        ParseStatementResponseDTO response = service.parseCsvStatement(
                multipart(CSV_HEADER + "\n"), StatementProvider.TRADE_REPUBLIC);

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getTransactions()).isEmpty();
    }

    @Test
    void rowWithUnparseableNumbersIsSkippedNotFatal() {
        String csv = csv(
                // Valid row
                row("2021-01-08T18:45:26Z", "2021-01-08", "TRADING", "BUY", "STOCK",
                        "Tesla", "US88160R1014", "1.0", "700.20", "-700.20", "-1.00", "EUR",
                        "tx-1"),
                // Garbage shares value — should be skipped, not crash the import
                row("2021-01-09T18:45:26Z", "2021-01-09", "TRADING", "BUY", "STOCK",
                        "Apple", "US0378331005", "not-a-number", "100.00", "-100.00", "0.00",
                        "EUR", "tx-bad")
        );

        ParseStatementResponseDTO response = service.parseCsvStatement(
                multipart(csv), StatementProvider.TRADE_REPUBLIC);

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getTransactions()).hasSize(1);
        assertThat(response.getMetadata().get("skippedByError")).isEqualTo(1);
    }

    // ---------- helpers ----------

    private static MultipartFile multipart(String csv) {
        return new MockMultipartFile(
                "file",
                "transactions.csv",
                "text/csv",
                csv.getBytes(StandardCharsets.UTF_8));
    }

    private static String csv(String... rows) {
        StringBuilder sb = new StringBuilder(CSV_HEADER).append('\n');
        for (String row : rows) {
            sb.append(row).append('\n');
        }
        return sb.toString();
    }

    /**
     * Builds a CSV row with the columns we care about plus blanks for
     * everything else. Order matches the header constant.
     */
    private static String row(String datetime, String date, String category, String type,
                              String assetClass, String name, String symbol, String shares,
                              String price, String amount, String fee, String currency,
                              String transactionId) {
        return String.join(",",
                quote(datetime), quote(date), quote("DEFAULT"), quote(category), quote(type),
                quote(assetClass), quote(name), quote(symbol), quote(shares), quote(price),
                quote(amount), quote(fee), quote(""), quote(currency),
                quote(""), quote(""), quote(""), quote(""),
                quote(transactionId), quote(""), quote(""), quote(""), quote(""));
    }

    private static String quote(String s) {
        return "\"" + (s == null ? "" : s) + "\"";
    }
}
