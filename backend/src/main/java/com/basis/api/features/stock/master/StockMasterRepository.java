package com.basis.api.features.stock.master;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StockMasterRepository extends JpaRepository<StockMaster, Long> {

    Optional<StockMaster> findBySymbol(String symbol);

    boolean existsBySymbol(String symbol);
    
    Optional<StockMaster> findByIsin(String isin);

    List<StockMaster> findByExchange(String exchange);

    List<StockMaster> findBySector(String sector);

    List<StockMaster> findByMarketCapCategory(MarketCapCategory marketCapCategory);

    @Query("SELECT s FROM StockMaster s WHERE LOWER(s.companyName) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(s.symbol) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<StockMaster> searchBySymbolOrCompanyName(@Param("search") String search);

    @Query("SELECT DISTINCT s.sector FROM StockMaster s WHERE s.sector IS NOT NULL ORDER BY s.sector")
    List<String> findAllSectors();

    @Query("SELECT DISTINCT s.exchange FROM StockMaster s WHERE s.exchange IS NOT NULL ORDER BY s.exchange")
    List<String> findAllExchanges();
}