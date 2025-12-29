package com.basis.api.features.stock.master;

import com.basis.api.features.stock.master.dto.CreateStockMasterRequest;
import com.basis.api.features.stock.master.dto.StockMasterDTO;
import com.basis.api.shared.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.ZonedDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StockMasterServiceTest {

    @Mock
    private StockMasterRepository stockMasterRepository;

    @InjectMocks
    private StockMasterService stockMasterService;

    private StockMaster mockStock;
    private CreateStockMasterRequest createRequest;

    @BeforeEach
    void setUp() {
        mockStock = new StockMaster("AAPL", "Apple Inc.");
        mockStock.setId(1L);
        mockStock.setExchange("NASDAQ");
        mockStock.setSector("Technology");
        mockStock.setIndustry("Consumer Electronics");
        mockStock.setMarketCapCategory(MarketCapCategory.LARGE);
        mockStock.setIsin("US0378331005");
        mockStock.setStockType("COMMON");
        mockStock.setCreatedAt(ZonedDateTime.now());
        mockStock.setUpdatedAt(ZonedDateTime.now());

        createRequest = new CreateStockMasterRequest();
        createRequest.setSymbol("AAPL");
        createRequest.setCompanyName("Apple Inc.");
        createRequest.setExchange("NASDAQ");
        createRequest.setSector("Technology");
        createRequest.setIndustry("Consumer Electronics");
        createRequest.setMarketCapCategory("LARGE");
        createRequest.setIsin("US0378331005");
        createRequest.setStockType("COMMON");
    }

    @Test
    void testCreateStock_Success() {
        when(stockMasterRepository.existsBySymbol("AAPL")).thenReturn(false);
        when(stockMasterRepository.save(any(StockMaster.class))).thenReturn(mockStock);

        StockMasterDTO result = stockMasterService.createStock(createRequest);

        assertThat(result).isNotNull();
        assertThat(result.getSymbol()).isEqualTo("AAPL");
        assertThat(result.getCompanyName()).isEqualTo("Apple Inc.");
        assertThat(result.getExchange()).isEqualTo("NASDAQ");
        assertThat(result.getSector()).isEqualTo("Technology");
        assertThat(result.getMarketCapCategory()).isEqualTo(MarketCapCategory.LARGE);

        verify(stockMasterRepository).existsBySymbol("AAPL");
        verify(stockMasterRepository).save(any(StockMaster.class));
    }

    @Test
    void testCreateStock_DuplicateSymbol() {
        when(stockMasterRepository.existsBySymbol("AAPL")).thenReturn(true);

        assertThatThrownBy(() -> stockMasterService.createStock(createRequest))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Stock with symbol AAPL already exists");

        verify(stockMasterRepository).existsBySymbol("AAPL");
        verify(stockMasterRepository, never()).save(any());
    }

    @Test
    void testCreateStock_InvalidMarketCapCategory() {
        createRequest.setMarketCapCategory("INVALID");

        when(stockMasterRepository.existsBySymbol("AAPL")).thenReturn(false);

        assertThatThrownBy(() -> stockMasterService.createStock(createRequest))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid market cap category: INVALID");
    }

    @Test
    void testGetStockById_Found() {
        when(stockMasterRepository.findById(1L)).thenReturn(Optional.of(mockStock));

        StockMasterDTO result = stockMasterService.getStockById(1L);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getSymbol()).isEqualTo("AAPL");

        verify(stockMasterRepository).findById(1L);
    }

    @Test
    void testGetStockById_NotFound() {
        when(stockMasterRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> stockMasterService.getStockById(1L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Stock not found with id: 1");

        verify(stockMasterRepository).findById(1L);
    }

    @Test
    void testGetStockBySymbol_Found() {
        when(stockMasterRepository.findBySymbol("AAPL")).thenReturn(Optional.of(mockStock));

        StockMasterDTO result = stockMasterService.getStockBySymbol("aapl"); // Testing lowercase

        assertThat(result).isNotNull();
        assertThat(result.getSymbol()).isEqualTo("AAPL");

        verify(stockMasterRepository).findBySymbol("AAPL"); // Should be uppercase
    }

    @Test
    void testGetStockBySymbol_NotFound() {
        when(stockMasterRepository.findBySymbol("XYZ")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> stockMasterService.getStockBySymbol("xyz"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Stock not found with symbol: xyz");

        verify(stockMasterRepository).findBySymbol("XYZ");
    }

    @Test
    void testGetAllStocks() {
        StockMaster stock2 = new StockMaster("MSFT", "Microsoft Corporation");
        stock2.setId(2L);

        when(stockMasterRepository.findAll()).thenReturn(Arrays.asList(mockStock, stock2));

        List<StockMasterDTO> result = stockMasterService.getAllStocks();

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getSymbol()).isEqualTo("AAPL");
        assertThat(result.get(1).getSymbol()).isEqualTo("MSFT");

        verify(stockMasterRepository).findAll();
    }

    @Test
    void testSearchStocks() {
        when(stockMasterRepository.searchBySymbolOrCompanyName("apple"))
                .thenReturn(Arrays.asList(mockStock));

        List<StockMasterDTO> result = stockMasterService.searchStocks("apple");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getSymbol()).isEqualTo("AAPL");

        verify(stockMasterRepository).searchBySymbolOrCompanyName("apple");
    }

    @Test
    void testGetStocksByExchange() {
        when(stockMasterRepository.findByExchange("NASDAQ"))
                .thenReturn(Arrays.asList(mockStock));

        List<StockMasterDTO> result = stockMasterService.getStocksByExchange("NASDAQ");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getExchange()).isEqualTo("NASDAQ");

        verify(stockMasterRepository).findByExchange("NASDAQ");
    }

    @Test
    void testGetStocksBySector() {
        when(stockMasterRepository.findBySector("Technology"))
                .thenReturn(Arrays.asList(mockStock));

        List<StockMasterDTO> result = stockMasterService.getStocksBySector("Technology");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getSector()).isEqualTo("Technology");

        verify(stockMasterRepository).findBySector("Technology");
    }

    @Test
    void testGetAllSectors() {
        when(stockMasterRepository.findAllSectors())
                .thenReturn(Arrays.asList("Technology", "Healthcare", "Finance"));

        List<String> result = stockMasterService.getAllSectors();

        assertThat(result).containsExactly("Technology", "Healthcare", "Finance");

        verify(stockMasterRepository).findAllSectors();
    }

    @Test
    void testGetAllExchanges() {
        when(stockMasterRepository.findAllExchanges())
                .thenReturn(Arrays.asList("NYSE", "NASDAQ", "LSE"));

        List<String> result = stockMasterService.getAllExchanges();

        assertThat(result).containsExactly("NYSE", "NASDAQ", "LSE");

        verify(stockMasterRepository).findAllExchanges();
    }

    @Test
    void testUpdateStock_Success() {
        CreateStockMasterRequest updateRequest = new CreateStockMasterRequest();
        updateRequest.setSymbol("AAPL");
        updateRequest.setCompanyName("Apple Inc. Updated");
        updateRequest.setExchange("NASDAQ");
        updateRequest.setSector("Technology");
        updateRequest.setIndustry("Consumer Electronics");
        updateRequest.setMarketCapCategory("MEGA");

        when(stockMasterRepository.findById(1L)).thenReturn(Optional.of(mockStock));
        when(stockMasterRepository.save(any(StockMaster.class))).thenReturn(mockStock);

        StockMasterDTO result = stockMasterService.updateStock(1L, updateRequest);

        assertThat(result).isNotNull();
        verify(stockMasterRepository).findById(1L);
        verify(stockMasterRepository).save(any(StockMaster.class));
    }

    @Test
    void testUpdateStock_NotFound() {
        when(stockMasterRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> stockMasterService.updateStock(1L, createRequest))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Stock not found with id: 1");

        verify(stockMasterRepository).findById(1L);
        verify(stockMasterRepository, never()).save(any());
    }

    @Test
    void testUpdateStock_ChangingSymbolToExisting() {
        CreateStockMasterRequest updateRequest = new CreateStockMasterRequest();
        updateRequest.setSymbol("MSFT"); // Different symbol
        updateRequest.setCompanyName("Apple Inc.");

        when(stockMasterRepository.findById(1L)).thenReturn(Optional.of(mockStock));
        when(stockMasterRepository.existsBySymbol("MSFT")).thenReturn(true);

        assertThatThrownBy(() -> stockMasterService.updateStock(1L, updateRequest))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Stock with symbol MSFT already exists");

        verify(stockMasterRepository).findById(1L);
        verify(stockMasterRepository).existsBySymbol("MSFT");
        verify(stockMasterRepository, never()).save(any());
    }

    @Test
    void testDeleteStock_Success() {
        when(stockMasterRepository.existsById(1L)).thenReturn(true);

        stockMasterService.deleteStock(1L);

        verify(stockMasterRepository).existsById(1L);
        verify(stockMasterRepository).deleteById(1L);
    }

    @Test
    void testDeleteStock_NotFound() {
        when(stockMasterRepository.existsById(1L)).thenReturn(false);

        assertThatThrownBy(() -> stockMasterService.deleteStock(1L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Stock not found with id: 1");

        verify(stockMasterRepository).existsById(1L);
        verify(stockMasterRepository, never()).deleteById(any());
    }

    @Test
    void testFindOrCreateStock_Exists() {
        when(stockMasterRepository.findBySymbol("AAPL")).thenReturn(Optional.of(mockStock));

        StockMaster result = stockMasterService.findOrCreateStock("aapl", "Apple Inc.");

        assertThat(result).isEqualTo(mockStock);
        verify(stockMasterRepository).findBySymbol("AAPL");
        verify(stockMasterRepository, never()).save(any());
    }

    @Test
    void testFindOrCreateStock_NotExists() {
        when(stockMasterRepository.findBySymbol("GOOGL")).thenReturn(Optional.empty());
        when(stockMasterRepository.save(any(StockMaster.class))).thenAnswer(invocation -> {
            StockMaster stock = invocation.getArgument(0);
            stock.setId(2L);
            return stock;
        });

        StockMaster result = stockMasterService.findOrCreateStock("googl", "Alphabet Inc.");

        assertThat(result).isNotNull();
        assertThat(result.getSymbol()).isEqualTo("GOOGL");
        assertThat(result.getCompanyName()).isEqualTo("Alphabet Inc.");

        verify(stockMasterRepository).findBySymbol("GOOGL");
        verify(stockMasterRepository).save(any(StockMaster.class));
    }

    @Test
    void testCreateStock_NullMarketCapCategory() {
        createRequest.setMarketCapCategory(null); // Testing null market cap

        when(stockMasterRepository.existsBySymbol("AAPL")).thenReturn(false);
        when(stockMasterRepository.save(any(StockMaster.class))).thenReturn(mockStock);

        StockMasterDTO result = stockMasterService.createStock(createRequest);

        assertThat(result).isNotNull();
        assertThat(result.getSymbol()).isEqualTo("AAPL");

        verify(stockMasterRepository).save(any(StockMaster.class));
    }
}