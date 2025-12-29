# Investment Domain Migration Guide

## Overview
The investment domain has been refactored to separate concerns and improve scalability. The old structure mixed stock information, positions, and transactions in a single entity. The new structure provides clear separation.

## Migration Changes

### 1. Stock Master Data
- **Old**: Stock information was duplicated in every `Stock` entity
- **New**: `StockMaster` table contains reference data for all stocks
- **Location**: `com.basis.api.features.stock.master`

### 2. Portfolio Positions
- **Old**: `Stock` entity handled both stock info and user positions
- **New**: `PortfolioPosition` entity tracks user holdings
- **Location**: `com.basis.api.features.investment.position`

### 3. Transactions
- **Old**: `StockTransaction` was specific to stocks only
- **New**: Generic `Transaction` entity supports multiple asset types
- **Location**: `com.basis.api.features.transaction`

## API Changes

### Old Endpoints (Deprecated)
- `POST /api/portfolios/{portfolioId}/stocks` - Buy stock
- `PUT /api/portfolios/{portfolioId}/stocks/{stockId}/sell` - Sell stock
- `GET /api/portfolios/{portfolioId}/stocks` - List stocks

### New Endpoints
- `POST /api/portfolios/{portfolioId}/positions/buy` - Buy stock
- `POST /api/portfolios/{portfolioId}/positions/sell` - Sell stock
- `GET /api/portfolios/{portfolioId}/positions` - List positions
- `GET /api/transactions` - Get all transactions
- `GET /api/stocks/master` - Get stock reference data

## Code Migration

### Buying Stock
**Old:**
```java
CreateStockRequest request = new CreateStockRequest("AAPL", "Apple Inc.", 
    new BigDecimal("10"), new BigDecimal("150.00"), LocalDate.now());
stockService.createStock(portfolioId, userId, request);
```

**New:**
```java
BuyPositionRequest request = new BuyPositionRequest("AAPL", 
    new BigDecimal("10"), new BigDecimal("150.00"), LocalDate.now());
positionService.buyStock(portfolioId, userId, request);
```

### Selling Stock
**Old:**
```java
SellStockRequest request = new SellStockRequest(
    new BigDecimal("5"), new BigDecimal("160.00"), LocalDate.now());
stockService.sellPartialStock(stockId, userId, request);
```

**New:**
```java
SellPositionRequest request = new SellPositionRequest(positionId,
    new BigDecimal("5"), new BigDecimal("160.00"), LocalDate.now());
positionService.sellStock(userId, request);
```

## Database Migration
The migration script (V7) automatically:
1. Creates new tables (stock_master, portfolio_positions, transactions)
2. Migrates existing data to new structure
3. Preserves all historical data

## Deprecation Timeline
- **Phase 1** (Current): Old endpoints marked as deprecated
- **Phase 2** (Next Release): Old endpoints return warnings
- **Phase 3** (Future Release): Old endpoints removed

## Benefits
1. **Scalability**: Easy to add crypto, forex, etc.
2. **Performance**: Better indexing and smaller tables
3. **Maintainability**: Clear separation of concerns
4. **Flexibility**: Generic transaction system