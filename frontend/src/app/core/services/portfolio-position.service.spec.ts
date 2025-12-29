import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PortfolioPositionService } from './portfolio-position.service';
import { 
  PortfolioPosition, 
  BuyPositionRequest, 
  SellPositionRequest, 
  PagedPositions, 
  PositionStatus 
} from '../models/portfolio-position.model';
import { MarketCapCategory } from '../models/stock-master.model';
import { environment } from '../../../environments/environment';

describe('PortfolioPositionService', () => {
  let service: PortfolioPositionService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/portfolios`;

  const mockPosition: PortfolioPosition = {
    id: 1,
    uuid: '123e4567-e89b-12d3-a456-426614174000',
    portfolioId: 100,
    stock: {
      id: 1,
      symbol: 'AAPL',
      companyName: 'Apple Inc.',
      exchange: 'NASDAQ',
      sector: 'Technology',
      industry: 'Consumer Electronics',
      marketCapCategory: MarketCapCategory.LARGE_CAP,
      isin: 'US0378331005',
      stockType: 'COMMON',
      currentPrice: 180.00,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    },
    quantity: 10,
    averageCostBasis: 150.00,
    totalCost: 1500.00,
    currentValue: 1800.00,
    unrealizedGainLoss: 300.00,
    unrealizedGainLossPercentage: 20.00,
    firstPurchaseDate: '2024-01-01',
    lastTransactionDate: '2024-01-01',
    status: PositionStatus.ACTIVE,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  };

  const mockBuyRequest: BuyPositionRequest = {
    stockSymbol: 'AAPL',
    companyName: 'Apple Inc.',
    quantity: 10,
    pricePerShare: 150.00,
    transactionDate: '2024-01-01',
    notes: 'Test buy'
  };

  const mockSellRequest: SellPositionRequest = {
    quantity: 5,
    pricePerShare: 180.00,
    transactionDate: '2024-01-15',
    notes: 'Test sell'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PortfolioPositionService]
    });
    service = TestBed.inject(PortfolioPositionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('buyPosition', () => {
    it('should buy a position and notify updates', (done) => {
      const portfolioUuid = 'portfolio-uuid';
      let notificationReceived = false;

      // Subscribe to position updates
      const subscription = service.positionsUpdated.subscribe(() => {
        notificationReceived = true;
      });

      service.buyPosition(portfolioUuid, mockBuyRequest).subscribe(position => {
        expect(position).toEqual(mockPosition);
        expect(notificationReceived).toBeTruthy();
        subscription.unsubscribe();
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/uuid/${portfolioUuid}/positions`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockBuyRequest);
      req.flush(mockPosition);
    });
  });

  describe('getPortfolioPositions', () => {
    it('should get all positions for a portfolio', (done) => {
      const portfolioUuid = 'portfolio-uuid';
      const mockPositions = [mockPosition];

      service.getPortfolioPositions(portfolioUuid).subscribe(positions => {
        expect(positions).toEqual(mockPositions);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/uuid/${portfolioUuid}/positions`);
      expect(req.request.method).toBe('GET');
      req.flush(mockPositions);
    });
  });

  describe('getPortfolioPositionsPaged', () => {
    it('should get paginated positions with default parameters', (done) => {
      const portfolioUuid = 'portfolio-uuid';
      const mockPagedPositions: PagedPositions = {
        content: [mockPosition],
        pageable: {
          pageNumber: 0,
          pageSize: 10,
          sort: {
            empty: true,
            sorted: false,
            unsorted: true
          }
        },
        totalElements: 1,
        totalPages: 1,
        size: 10,
        number: 0,
        numberOfElements: 1,
        first: true,
        last: true,
        empty: false
      };

      service.getPortfolioPositionsPaged(portfolioUuid).subscribe(result => {
        expect(result).toEqual(mockPagedPositions);
        done();
      });

      const req = httpMock.expectOne(req => 
        req.url === `${apiUrl}/uuid/${portfolioUuid}/positions` &&
        req.params.get('page') === '0' &&
        req.params.get('size') === '10' &&
        req.params.get('sortBy') === 'createdAt' &&
        req.params.get('sortDir') === 'desc'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockPagedPositions);
    });

    it('should get paginated positions with custom parameters', (done) => {
      const portfolioUuid = 'portfolio-uuid';
      const mockPagedPositions: PagedPositions = {
        content: [mockPosition],
        pageable: {
          pageNumber: 1,
          pageSize: 20,
          sort: {
            empty: false,
            sorted: true,
            unsorted: false
          }
        },
        totalElements: 20,
        totalPages: 2,
        size: 20,
        number: 1,
        numberOfElements: 20,
        first: false,
        last: false,
        empty: false
      };

      service.getPortfolioPositionsPaged(portfolioUuid, 1, 20, 'stockSymbol', 'asc').subscribe(result => {
        expect(result).toEqual(mockPagedPositions);
        done();
      });

      const req = httpMock.expectOne(req => 
        req.url === `${apiUrl}/uuid/${portfolioUuid}/positions` &&
        req.params.get('page') === '1' &&
        req.params.get('size') === '20' &&
        req.params.get('sortBy') === 'stockSymbol' &&
        req.params.get('sortDir') === 'asc'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockPagedPositions);
    });
  });

  describe('getPositionByUuid', () => {
    it('should get a position by UUID', (done) => {
      const portfolioUuid = 'portfolio-uuid';
      const positionUuid = '123e4567-e89b-12d3-a456-426614174000';

      service.getPositionByUuid(portfolioUuid, positionUuid).subscribe(position => {
        expect(position).toEqual(mockPosition);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/uuid/${portfolioUuid}/positions/${positionUuid}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockPosition);
    });
  });

  describe('sellPosition', () => {
    it('should sell a position and notify updates', (done) => {
      const portfolioUuid = 'portfolio-uuid';
      const positionUuid = '123e4567-e89b-12d3-a456-426614174000';
      let notificationReceived = false;

      // Subscribe to position updates
      const subscription = service.positionsUpdated.subscribe(() => {
        notificationReceived = true;
      });

      service.sellPosition(portfolioUuid, positionUuid, mockSellRequest).subscribe(position => {
        expect(position).toEqual(mockPosition);
        expect(notificationReceived).toBeTruthy();
        subscription.unsubscribe();
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/uuid/${portfolioUuid}/positions/${positionUuid}/sell`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockSellRequest);
      req.flush(mockPosition);
    });
  });

  describe('getPositionsByStatus', () => {
    it('should get positions by status', (done) => {
      const portfolioUuid = 'portfolio-uuid';
      const status = PositionStatus.ACTIVE;
      const mockPositions = [mockPosition];

      service.getPositionsByStatus(portfolioUuid, status).subscribe(positions => {
        expect(positions).toEqual(mockPositions);
        done();
      });

      const req = httpMock.expectOne(req => 
        req.url === `${apiUrl}/uuid/${portfolioUuid}/positions` &&
        req.params.get('status') === status
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockPositions);
    });
  });

  describe('searchPositions', () => {
    it('should search positions by symbol', (done) => {
      const portfolioUuid = 'portfolio-uuid';
      const symbol = 'AAPL';
      const mockPositions = [mockPosition];

      service.searchPositions(portfolioUuid, symbol).subscribe(positions => {
        expect(positions).toEqual(mockPositions);
        done();
      });

      const req = httpMock.expectOne(req => 
        req.url === `${apiUrl}/uuid/${portfolioUuid}/positions/search` &&
        req.params.get('symbol') === symbol
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockPositions);
    });
  });

  describe('deletePosition', () => {
    it('should delete a position and notify updates', (done) => {
      const portfolioUuid = 'portfolio-uuid';
      const positionUuid = '123e4567-e89b-12d3-a456-426614174000';
      let notificationReceived = false;

      // Subscribe to position updates
      const subscription = service.positionsUpdated.subscribe(() => {
        notificationReceived = true;
      });

      service.deletePosition(portfolioUuid, positionUuid).subscribe(() => {
        expect(notificationReceived).toBeTruthy();
        subscription.unsubscribe();
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/uuid/${portfolioUuid}/positions/${positionUuid}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('refreshPositions', () => {
    it('should trigger position update notification', (done) => {
      let notificationReceived = false;

      const subscription = service.positionsUpdated.subscribe(() => {
        notificationReceived = true;
        expect(notificationReceived).toBeTruthy();
        subscription.unsubscribe();
        done();
      });

      service.refreshPositions();
    });
  });

  describe('formatting utilities', () => {
    it('should format amount correctly', () => {
      const result = service.formatAmount(1234.56);
      expect(result).toMatch(/1\.234,56/); // German format
    });

    it('should format percentage correctly', () => {
      const result = service.formatPercentage(20.5);
      expect(result).toBe('20.50%');
    });

    it('should format date correctly', () => {
      const result = service.formatDate('2024-01-15');
      expect(result).toMatch(/Jan 15, 2024/);
    });

    it('should format datetime correctly', () => {
      const result = service.formatDateTime('2024-01-15T14:30:00');
      expect(result).toMatch(/Jan 15, 2024/);
      expect(result).toMatch(/2:30/);
    });
  });

  describe('styling utilities', () => {
    it('should return correct color class for positive gain/loss', () => {
      const result = service.getGainLossColorClass(100);
      expect(result).toBe('text-green-500');
    });

    it('should return correct color class for negative gain/loss', () => {
      const result = service.getGainLossColorClass(-100);
      expect(result).toBe('text-red-500');
    });

    it('should return correct color class for zero gain/loss', () => {
      const result = service.getGainLossColorClass(0);
      expect(result).toBe('text-gray-500');
    });

    it('should return correct icon for positive gain/loss', () => {
      const result = service.getGainLossIcon(100);
      expect(result).toBe('pi pi-trending-up');
    });

    it('should return correct icon for negative gain/loss', () => {
      const result = service.getGainLossIcon(-100);
      expect(result).toBe('pi pi-trending-down');
    });

    it('should return correct icon for zero gain/loss', () => {
      const result = service.getGainLossIcon(0);
      expect(result).toBe('pi pi-minus');
    });
  });

  describe('calculatePositionMetrics', () => {
    it('should calculate metrics for profitable position', () => {
      const metrics = service.calculatePositionMetrics(mockPosition);
      expect(metrics.isProfit).toBeTruthy();
      expect(metrics.isLoss).toBeFalsy();
      expect(metrics.canSell).toBeTruthy();
    });

    it('should calculate metrics for losing position', () => {
      const losingPosition = { ...mockPosition, unrealizedGainLoss: -100 };
      const metrics = service.calculatePositionMetrics(losingPosition);
      expect(metrics.isProfit).toBeFalsy();
      expect(metrics.isLoss).toBeTruthy();
      expect(metrics.canSell).toBeTruthy();
    });

    it('should calculate metrics for closed position', () => {
      const closedPosition = { ...mockPosition, status: PositionStatus.CLOSED, quantity: 0 };
      const metrics = service.calculatePositionMetrics(closedPosition);
      expect(metrics.canSell).toBeFalsy();
    });
  });

  describe('validation methods', () => {
    describe('validateBuyPositionRequest', () => {
      it('should return true for valid request', () => {
        const result = service.validateBuyPositionRequest(mockBuyRequest);
        expect(result).toBeTruthy();
      });

      it('should return false for missing stock symbol', () => {
        const invalidRequest = { ...mockBuyRequest, stockSymbol: '' };
        const result = service.validateBuyPositionRequest(invalidRequest);
        expect(result).toBeFalsy();
      });

      it('should return false for invalid quantity', () => {
        const invalidRequest = { ...mockBuyRequest, quantity: 0 };
        const result = service.validateBuyPositionRequest(invalidRequest);
        expect(result).toBeFalsy();
      });

      it('should return false for invalid price', () => {
        const invalidRequest = { ...mockBuyRequest, pricePerShare: 0 };
        const result = service.validateBuyPositionRequest(invalidRequest);
        expect(result).toBeFalsy();
      });

      it('should return false for missing transaction date', () => {
        const invalidRequest = { ...mockBuyRequest, transactionDate: '' };
        const result = service.validateBuyPositionRequest(invalidRequest);
        expect(result).toBeFalsy();
      });
    });

    describe('validateSellPositionRequest', () => {
      it('should return true for valid request', () => {
        const result = service.validateSellPositionRequest(mockSellRequest, 10);
        expect(result).toBeTruthy();
      });

      it('should return false for invalid quantity', () => {
        const invalidRequest = { ...mockSellRequest, quantity: 0 };
        const result = service.validateSellPositionRequest(invalidRequest, 10);
        expect(result).toBeFalsy();
      });

      it('should return false for quantity exceeding available', () => {
        const invalidRequest = { ...mockSellRequest, quantity: 15 };
        const result = service.validateSellPositionRequest(invalidRequest, 10);
        expect(result).toBeFalsy();
      });

      it('should return false for invalid price', () => {
        const invalidRequest = { ...mockSellRequest, pricePerShare: 0 };
        const result = service.validateSellPositionRequest(invalidRequest, 10);
        expect(result).toBeFalsy();
      });

      it('should return false for missing transaction date', () => {
        const invalidRequest = { ...mockSellRequest, transactionDate: '' };
        const result = service.validateSellPositionRequest(invalidRequest, 10);
        expect(result).toBeFalsy();
      });
    });
  });
});