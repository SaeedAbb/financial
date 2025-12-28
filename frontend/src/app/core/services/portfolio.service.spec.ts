import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PortfolioService } from './portfolio.service';
import { 
  Portfolio, 
  CreatePortfolioRequest, 
  UpdatePortfolioRequest, 
  PagedPortfolios,
  PortfolioStatistics,
  PortfolioSummary
} from '../models/portfolio.model';
import { StockGroup } from '../models/stock-group.model';
import { environment } from '../../../environments/environment';

describe('PortfolioService', () => {
  let service: PortfolioService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/portfolios`;

  const mockPortfolio: Portfolio = {
    id: 1,
    uuid: '123e4567-e89b-12d3-a456-426614174000',
    userId: 'user123',
    name: 'Test Portfolio',
    description: 'Test Description',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  };

  const mockPagedPortfolios: PagedPortfolios = {
    content: [mockPortfolio],
    pageable: {
      pageNumber: 0,
      pageSize: 10,
      sort: {
        empty: false,
        sorted: true,
        unsorted: false
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

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PortfolioService]
    });
    service = TestBed.inject(PortfolioService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('createPortfolio', () => {
    it('should create a portfolio and notify updates', (done) => {
      const createRequest: CreatePortfolioRequest = {
        name: 'New Portfolio',
        description: 'New Description'
      };

      let notificationReceived = false;
      service.portfoliosUpdated.subscribe(() => {
        notificationReceived = true;
      });

      service.createPortfolio(createRequest).subscribe({
        next: (portfolio) => {
          expect(portfolio).toEqual(mockPortfolio);
          expect(notificationReceived).toBeTruthy();
          done();
        }
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createRequest);
      req.flush(mockPortfolio);
    });
  });

  describe('getPortfolios', () => {
    it('should retrieve paginated portfolios with default parameters', () => {
      service.getPortfolios().subscribe((response) => {
        expect(response).toEqual(mockPagedPortfolios);
      });

      const req = httpMock.expectOne((request) => request.url === apiUrl);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('page')).toBe('0');
      expect(req.request.params.get('size')).toBe('10');
      expect(req.request.params.get('sortBy')).toBe('createdAt');
      expect(req.request.params.get('sortDir')).toBe('desc');
      req.flush(mockPagedPortfolios);
    });

    it('should retrieve paginated portfolios with custom parameters', () => {
      service.getPortfolios(2, 20, 'name', 'asc').subscribe((response) => {
        expect(response).toEqual(mockPagedPortfolios);
      });

      const req = httpMock.expectOne((request) => request.url === apiUrl);
      expect(req.request.params.get('page')).toBe('2');
      expect(req.request.params.get('size')).toBe('20');
      expect(req.request.params.get('sortBy')).toBe('name');
      expect(req.request.params.get('sortDir')).toBe('asc');
      req.flush(mockPagedPortfolios);
    });
  });

  describe('getAllPortfolios', () => {
    it('should retrieve all portfolios', () => {
      const portfolios = [mockPortfolio];

      service.getAllPortfolios().subscribe((response) => {
        expect(response).toEqual(portfolios);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('GET');
      req.flush(portfolios);
    });
  });

  describe('getPortfolioByUuid', () => {
    it('should retrieve a portfolio by UUID', () => {
      const uuid = mockPortfolio.uuid;

      service.getPortfolioByUuid(uuid).subscribe((portfolio) => {
        expect(portfolio).toEqual(mockPortfolio);
      });

      const req = httpMock.expectOne(`${apiUrl}/uuid/${uuid}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockPortfolio);
    });
  });

  describe('updatePortfolio', () => {
    it('should update a portfolio and notify updates', (done) => {
      const uuid = mockPortfolio.uuid;
      const updateRequest: UpdatePortfolioRequest = {
        name: 'Updated Portfolio',
        description: 'Updated Description'
      };

      let notificationReceived = false;
      service.portfoliosUpdated.subscribe(() => {
        notificationReceived = true;
      });

      service.updatePortfolio(uuid, updateRequest).subscribe({
        next: (portfolio) => {
          expect(portfolio).toEqual(mockPortfolio);
          expect(notificationReceived).toBeTruthy();
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/uuid/${uuid}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateRequest);
      req.flush(mockPortfolio);
    });
  });

  describe('deletePortfolio', () => {
    it('should delete a portfolio and notify updates', (done) => {
      const uuid = mockPortfolio.uuid;

      let notificationReceived = false;
      service.portfoliosUpdated.subscribe(() => {
        notificationReceived = true;
      });

      service.deletePortfolio(uuid).subscribe({
        next: () => {
          expect(notificationReceived).toBeTruthy();
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/uuid/${uuid}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('getPortfolioStatistics', () => {
    it('should retrieve portfolio statistics', () => {
      const uuid = mockPortfolio.uuid;
      const mockStatistics: PortfolioStatistics = {
        id: 1,
        uuid: uuid,
        name: 'Test Portfolio',
        totalInvestment: 10000,
        totalCurrentValue: 12000,
        totalGainLoss: 2000,
        gainLossPercentage: 20,
        activePositionsCount: 5,
        closedPositionsCount: 2,
        totalPositionsCount: 7,
        distinctStocksCount: 5,
        oldestPositionDate: '2023-01-01T00:00:00Z',
        newestPositionDate: '2024-01-01T00:00:00Z'
      };

      service.getPortfolioStatistics(uuid).subscribe((statistics) => {
        expect(statistics).toEqual(mockStatistics);
      });

      const req = httpMock.expectOne(`${apiUrl}/${uuid}/statistics`);
      expect(req.request.method).toBe('GET');
      req.flush(mockStatistics);
    });
  });

  describe('getPortfoliosSummary', () => {
    it('should retrieve portfolios summary', () => {
      const mockSummary: PortfolioSummary = {
        totalPortfolios: 3,
        totalActivePositions: 15,
        totalClosedPositions: 5,
        totalDistinctStocks: 10,
        totalInvestment: 50000,
        totalCurrentValue: 60000,
        totalGainLoss: 10000,
        totalGainLossPercentage: 20
      };

      service.getPortfoliosSummary().subscribe((summary) => {
        expect(summary).toEqual(mockSummary);
      });

      const req = httpMock.expectOne(`${apiUrl}/summary`);
      expect(req.request.method).toBe('GET');
      req.flush(mockSummary);
    });
  });

  describe('getStockGroups', () => {
    it('should retrieve stock groups with default parameters', () => {
      const uuid = mockPortfolio.uuid;
      const mockStockGroups: StockGroup[] = [{
        symbol: 'AAPL',
        companyName: 'Apple Inc.',
        currentPrice: 150.00,
        totalQuantity: 10,
        activeQuantity: 10,
        soldQuantity: 0,
        weightedAveragePrice: 140.00,
        totalCost: 1400.00,
        totalCurrentValue: 1500.00,
        totalGainLoss: 100.00,
        gainLossPercentage: 7.14,
        firstPurchaseDate: '2023-01-01T00:00:00Z',
        lastPurchaseDate: '2023-06-01T00:00:00Z',
        positionCount: 2,
        positions: []
      }];

      service.getStockGroups(uuid).subscribe((groups) => {
        expect(groups).toEqual(mockStockGroups);
      });

      const req = httpMock.expectOne((request) => 
        request.url === `${apiUrl}/${uuid}/stock-groups`
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('sortBy')).toBe('symbol');
      expect(req.request.params.get('sortDir')).toBe('asc');
      req.flush(mockStockGroups);
    });

    it('should retrieve stock groups with search parameter', () => {
      const uuid = mockPortfolio.uuid;
      const search = 'AAPL';

      service.getStockGroups(uuid, search).subscribe();

      const req = httpMock.expectOne((request) => 
        request.url === `${apiUrl}/${uuid}/stock-groups`
      );
      expect(req.request.params.get('search')).toBe('AAPL');
      req.flush([]);
    });
  });

  describe('utility methods', () => {
    it('should format currency correctly', () => {
      expect(service.formatCurrency(1234.56)).toBe('$1,234.56');
      expect(service.formatCurrency(1000000)).toBe('$1,000,000.00');
    });

    it('should format currency compact correctly', () => {
      expect(service.formatCurrencyCompact(1234)).toBe('$1,234.00');
      expect(service.formatCurrencyCompact(1234567)).toBe('$1.23M');
      expect(service.formatCurrencyCompact(1234567890)).toBe('$1.23B');
    });

    it('should format percentage correctly', () => {
      expect(service.formatPercentage(20)).toBe('20.00%');
      expect(service.formatPercentage(-5.5)).toBe('-5.50%');
    });

    it('should format quantity correctly', () => {
      expect(service.formatQuantity(10)).toBe('10');
      expect(service.formatQuantity(10.12345)).toBe('10.12');
      expect(service.formatQuantity(0.123456)).toBe('0.123456');
    });

    it('should validate portfolio name correctly', () => {
      expect(service.validatePortfolioName('Valid Name')).toBeTruthy();
      expect(service.validatePortfolioName('')).toBeFalsy();
      expect(service.validatePortfolioName('   ')).toBeFalsy();
      expect(service.validatePortfolioName('a'.repeat(101))).toBeFalsy();
    });

    it('should validate portfolio description correctly', () => {
      expect(service.validatePortfolioDescription('Valid description')).toBeTruthy();
      expect(service.validatePortfolioDescription(undefined)).toBeTruthy();
      expect(service.validatePortfolioDescription('a'.repeat(1001))).toBeFalsy();
    });

    it('should validate percentage correctly', () => {
      expect(service.validatePercentage(50)).toBeTruthy();
      expect(service.validatePercentage(0)).toBeTruthy();
      expect(service.validatePercentage(-100)).toBeTruthy();
      expect(service.validatePercentage(1000)).toBeTruthy();
      expect(service.validatePercentage(1001)).toBeFalsy();
      expect(service.validatePercentage(NaN)).toBeFalsy();
    });

    it('should validate currency amount correctly', () => {
      expect(service.validateCurrencyAmount(100)).toBeTruthy();
      expect(service.validateCurrencyAmount(0)).toBeTruthy();
      expect(service.validateCurrencyAmount(-100)).toBeFalsy();
      expect(service.validateCurrencyAmount(1000000001)).toBeFalsy();
      expect(service.validateCurrencyAmount(NaN)).toBeFalsy();
    });

    it('should get correct gain/loss color class', () => {
      expect(service.getGainLossColorClass(100)).toBe('text-green-500');
      expect(service.getGainLossColorClass(-100)).toBe('text-red-500');
      expect(service.getGainLossColorClass(0)).toBe('text-gray-500');
    });

    it('should get correct gain/loss icon', () => {
      expect(service.getGainLossIcon(100)).toBe('pi pi-trending-up');
      expect(service.getGainLossIcon(-100)).toBe('pi pi-trending-down');
      expect(service.getGainLossIcon(0)).toBe('pi pi-minus');
    });

    it('should get correct performance severity', () => {
      expect(service.getPerformanceSeverity(100)).toBe('success');
      expect(service.getPerformanceSeverity(-100)).toBe('danger');
      expect(service.getPerformanceSeverity(0)).toBe('info');
    });

    it('should format date correctly', () => {
      const result = service.formatDate('2024-01-15T00:00:00Z');
      expect(result).toContain('Jan');
      expect(result).toContain('15');
      expect(result).toContain('2024');
    });

    it('should calculate days since date correctly', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(service.getDaysSince(yesterday.toISOString())).toBe(1);
    });

    it('should get relative date string correctly', () => {
      const today = new Date().toISOString();
      expect(service.getRelativeDateString(today)).toBe('Today');

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(service.getRelativeDateString(yesterday.toISOString())).toBe('Yesterday');

      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      expect(service.getRelativeDateString(lastWeek.toISOString())).toBe('7 days ago');
    });
  });

  describe('refreshPortfolios', () => {
    it('should trigger portfolios update notification', (done) => {
      service.portfoliosUpdated.subscribe(() => {
        expect(true).toBeTruthy();
        done();
      });

      service.refreshPortfolios();
    });
  });
});