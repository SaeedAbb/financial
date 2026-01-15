package com.basis.api.features.stock.master;

import com.basis.api.features.integration.finnhub.FinnhubService;
import com.basis.api.features.integration.finnhub.dto.FinnhubStockProfileDTO;
import com.basis.api.features.integration.finnhub.exception.FinnhubApiException;
import com.basis.api.features.stock.master.dto.CreateStockMasterRequest;
import com.basis.api.features.stock.master.dto.StockMasterDTO;
import com.basis.api.shared.exception.ResourceNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class StockMasterService {

    private static final Logger logger = LoggerFactory.getLogger(StockMasterService.class);
    
    private final StockMasterRepository stockMasterRepository;
    private final FinnhubService finnhubService;

    public StockMasterService(StockMasterRepository stockMasterRepository, 
                            FinnhubService finnhubService) {
        this.stockMasterRepository = stockMasterRepository;
        this.finnhubService = finnhubService;
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
        stock.setStockType(request.getStockType());
        
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
        stock.setStockType(request.getStockType());
        
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
    
    /**
     * Find or enrich stock master by ISIN
     * 1. Check if we have this ISIN
     * 2. If not, call Finnhub API
     * 3. If ticker exists, update with ISIN
     * 4. If ticker doesn't exist, create new
     * 
     * @param isin The ISIN to look up
     * @return StockMaster entity (found, updated, or created)
     */
    @Transactional
    public StockMaster findOrEnrichByIsin(String isin) {
        logger.info("Finding or enriching stock by ISIN: {}", isin);
        
        // Step 1: Check if we already have this ISIN
        Optional<StockMaster> existingByIsin = stockMasterRepository.findByIsin(isin);
        if (existingByIsin.isPresent()) {
            logger.debug("Stock found by ISIN: {} -> {}", isin, existingByIsin.get().getSymbol());
            return existingByIsin.get();
        }
        
        // Step 2: Call Finnhub to get stock info
        FinnhubStockProfileDTO profile;
        try {
            profile = finnhubService.getStockProfile(isin);
        } catch (FinnhubApiException e) {
            logger.error("Failed to get stock profile from Finnhub for ISIN: {}", isin, e);
            // Re-throw to maintain transactional integrity - all or nothing
            throw new ResourceNotFoundException("Stock not found for ISIN: " + isin);
        }
        
        // Step 3: Check if we have this ticker
        Optional<StockMaster> existingBySymbol = stockMasterRepository.findBySymbol(profile.getTicker());
        if (existingBySymbol.isPresent()) {
            // Update existing stock with ISIN
            StockMaster existing = existingBySymbol.get();
            logger.info("Updating existing stock {} with ISIN: {}", existing.getSymbol(), isin);
            
            existing.setIsin(isin);
            
            // Update other fields if they are empty
            if (existing.getIndustry() == null || existing.getIndustry().isEmpty()) {
                existing.setIndustry(profile.getFinnhubIndustry());
            }
            if (existing.getExchange() == null || existing.getExchange().isEmpty()) {
                existing.setExchange(profile.getExchange());
            }
            if (existing.getMarketCapCategory() == null) {
                existing.setMarketCapCategory(finnhubService.calculateMarketCapCategory(profile.getMarketCapitalization()));
            }
            
            return stockMasterRepository.save(existing);
        }
        
        // Step 4: Create new stock master
        logger.info("Creating new stock from Finnhub data: {} ({})", profile.getTicker(), profile.getName());
        
        StockMaster newStock = new StockMaster();
        newStock.setSymbol(profile.getTicker());
        newStock.setCompanyName(profile.getName());
        newStock.setIsin(isin);
        newStock.setExchange(profile.getExchange());
        newStock.setIndustry(profile.getFinnhubIndustry());
        newStock.setMarketCapCategory(finnhubService.calculateMarketCapCategory(profile.getMarketCapitalization()));
        newStock.setStockType("Common Stock"); // Default type
        
        return stockMasterRepository.save(newStock);
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
        dto.setStockType(stock.getStockType());
        dto.setCreatedAt(stock.getCreatedAt());
        dto.setUpdatedAt(stock.getUpdatedAt());
        return dto;
    }
}