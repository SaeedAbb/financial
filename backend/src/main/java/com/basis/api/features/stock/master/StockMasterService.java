package com.basis.api.features.stock.master;

import com.basis.api.features.stock.master.dto.CreateStockMasterRequest;
import com.basis.api.features.stock.master.dto.StockMasterDTO;
import com.basis.api.shared.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class StockMasterService {

    private final StockMasterRepository stockMasterRepository;

    public StockMasterService(StockMasterRepository stockMasterRepository) {
        this.stockMasterRepository = stockMasterRepository;
    }

    public StockMasterDTO createStock(CreateStockMasterRequest request) {
        if (stockMasterRepository.existsBySymbol(request.getSymbol())) {
            throw new IllegalArgumentException("Stock with symbol " + request.getSymbol() + " already exists");
        }

        StockMaster stock = new StockMaster(request.getSymbol(), request.getCompanyName());
        stock.setExchange(request.getExchange());
        stock.setSector(request.getSector());
        stock.setIndustry(request.getIndustry());
        stock.setIsin(request.getIsin());
        
        if (request.getMarketCapCategory() != null) {
            try {
                stock.setMarketCapCategory(MarketCapCategory.valueOf(request.getMarketCapCategory()));
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid market cap category: " + request.getMarketCapCategory());
            }
        }

        StockMaster savedStock = stockMasterRepository.save(stock);
        return toDTO(savedStock);
    }

    @Transactional(readOnly = true)
    public StockMasterDTO getStockById(Long id) {
        StockMaster stock = stockMasterRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Stock not found with id: " + id));
        return toDTO(stock);
    }

    @Transactional(readOnly = true)
    public StockMasterDTO getStockBySymbol(String symbol) {
        StockMaster stock = stockMasterRepository.findBySymbol(symbol.toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Stock not found with symbol: " + symbol));
        return toDTO(stock);
    }

    @Transactional(readOnly = true)
    public List<StockMasterDTO> getAllStocks() {
        return stockMasterRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<StockMasterDTO> searchStocks(String search) {
        return stockMasterRepository.searchBySymbolOrCompanyName(search).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<StockMasterDTO> getStocksByExchange(String exchange) {
        return stockMasterRepository.findByExchange(exchange).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<StockMasterDTO> getStocksBySector(String sector) {
        return stockMasterRepository.findBySector(sector).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<String> getAllSectors() {
        return stockMasterRepository.findAllSectors();
    }

    @Transactional(readOnly = true)
    public List<String> getAllExchanges() {
        return stockMasterRepository.findAllExchanges();
    }

    public StockMasterDTO updateStock(Long id, CreateStockMasterRequest request) {
        StockMaster stock = stockMasterRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Stock not found with id: " + id));

        // Don't allow changing symbol if it's already used by another stock
        if (!stock.getSymbol().equals(request.getSymbol()) && 
            stockMasterRepository.existsBySymbol(request.getSymbol())) {
            throw new IllegalArgumentException("Stock with symbol " + request.getSymbol() + " already exists");
        }

        stock.setSymbol(request.getSymbol());
        stock.setCompanyName(request.getCompanyName());
        stock.setExchange(request.getExchange());
        stock.setSector(request.getSector());
        stock.setIndustry(request.getIndustry());
        stock.setIsin(request.getIsin());
        
        if (request.getMarketCapCategory() != null) {
            try {
                stock.setMarketCapCategory(MarketCapCategory.valueOf(request.getMarketCapCategory()));
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid market cap category: " + request.getMarketCapCategory());
            }
        }

        StockMaster updatedStock = stockMasterRepository.save(stock);
        return toDTO(updatedStock);
    }

    public void deleteStock(Long id) {
        if (!stockMasterRepository.existsById(id)) {
            throw new ResourceNotFoundException("Stock not found with id: " + id);
        }
        stockMasterRepository.deleteById(id);
    }

    // Internal method to find or create stock
    @Transactional
    public StockMaster findOrCreateStock(String symbol, String companyName) {
        return stockMasterRepository.findBySymbol(symbol.toUpperCase())
                .orElseGet(() -> {
                    StockMaster newStock = new StockMaster(symbol, companyName);
                    return stockMasterRepository.save(newStock);
                });
    }

    private StockMasterDTO toDTO(StockMaster stock) {
        StockMasterDTO dto = new StockMasterDTO();
        dto.setId(stock.getId());
        dto.setSymbol(stock.getSymbol());
        dto.setCompanyName(stock.getCompanyName());
        dto.setExchange(stock.getExchange());
        dto.setSector(stock.getSector());
        dto.setIndustry(stock.getIndustry());
        dto.setMarketCapCategory(stock.getMarketCapCategory());
        dto.setIsin(stock.getIsin());
        dto.setCreatedAt(stock.getCreatedAt());
        dto.setUpdatedAt(stock.getUpdatedAt());
        return dto;
    }
}