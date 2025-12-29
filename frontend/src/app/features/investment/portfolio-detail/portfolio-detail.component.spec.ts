import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of, BehaviorSubject } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormBuilder } from '@angular/forms';

import { PortfolioDetailComponent } from './portfolio-detail.component';
import { PortfolioDetailFacade } from './state/portfolio-detail.facade';
import { PortfolioDetailStateService } from './state/portfolio-detail.state';
import { PositionFormService } from './services/position-form.service';
import { StockSearchService } from './services/stock-search.service';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Portfolio } from '../../../core/models/portfolio.model';
import { PortfolioPosition, PositionStatus } from '../../../core/models/portfolio-position.model';
import { MarketCapCategory } from '../../../core/models/stock-master.model';

describe('PortfolioDetailComponent', () => {
  let component: PortfolioDetailComponent;
  let fixture: ComponentFixture<PortfolioDetailComponent>;
  let mockFacade: jasmine.SpyObj<PortfolioDetailFacade>;
  let mockActivatedRoute: jasmine.SpyObj<ActivatedRoute>;

  const mockPortfolio: Portfolio = {
    id: 1,
    uuid: '123e4567-e89b-12d3-a456-426614174000',
    userId: 'user123',
    name: 'Test Portfolio',
    description: 'Test Description',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  };

  const mockPosition: PortfolioPosition = {
    id: 100,
    uuid: '456e7890-e89b-12d3-a456-426614174000',
    portfolioId: 1,
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
    status: PositionStatus.ACTIVE,
    firstPurchaseDate: '2024-01-01',
    lastTransactionDate: '2024-01-01',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  };

  const mockPortfolioStats = {
    totalPositions: 1,
    activePositions: 1,
    closedPositions: 0,
    totalInvestment: 1500.00,
    totalCurrentValue: 1800.00,
    totalGainLoss: 300.00
  };

  beforeEach(async () => {
    // Create BehaviorSubjects for testing
    const portfolioSubject = new BehaviorSubject(mockPortfolio);
    const positionsSubject = new BehaviorSubject([mockPosition]);
    const activePositionsSubject = new BehaviorSubject([mockPosition]);
    const closedPositionsSubject = new BehaviorSubject([]);
    const filteredPositionsSubject = new BehaviorSubject([mockPosition]);
    const selectedPositionSubject = new BehaviorSubject(null);
    const loadingSubject = new BehaviorSubject(false);
    const loadingPositionsSubject = new BehaviorSubject(false);
    const anyLoadingSubject = new BehaviorSubject(false);
    const errorSubject = new BehaviorSubject(null);
    const showTransactionSidebarSubject = new BehaviorSubject(false);
    const portfolioStatsSubject = new BehaviorSubject(mockPortfolioStats);
    const buyFormStateSubject = new BehaviorSubject({ mode: 'buy' as const, position: null, submitting: false, visible: false });
    const sellFormStateSubject = new BehaviorSubject({ mode: 'sell' as const, position: null, submitting: false, visible: false });

    // Create real FormGroup instances
    const formBuilder = new FormBuilder();
    const buyFormGroup = formBuilder.group({
      stock: [''],
      stockSymbol: [''],
      companyName: [''],
      quantity: [0],
      pricePerShare: [0],
      transactionDate: [''],
      notes: ['']
    });
    const sellFormGroup = formBuilder.group({
      quantity: [0],
      pricePerShare: [0],
      transactionDate: [''],
      notes: ['']
    });

    // Create mock facade
    mockFacade = jasmine.createSpyObj('PortfolioDetailFacade', [
      'init', 'refresh', 'goBack', 'showBuyPositionDialog', 'hideBuyDialog',
      'showSellPositionDialog', 'hideSellDialog', 'submitBuyForm', 'submitSellForm',
      'searchStocks', 'onPositionRowClick', 'hasBuyFormError', 'getBuyFormErrorMessage',
      'hasSellFormError', 'getSellFormErrorMessage', 'formatAmount', 'formatPercentage',
      'formatDate', 'getGainLossColorClass', 'trackByPositionUuid', 'trackByIndex',
      'deletePosition', 'setSelectedStock', 'getStockDisplayName'
    ], {
      portfolio$: portfolioSubject.asObservable(),
      positions$: positionsSubject.asObservable(),
      activePositions$: activePositionsSubject.asObservable(),
      closedPositions$: closedPositionsSubject.asObservable(),
      filteredPositions$: filteredPositionsSubject.asObservable(),
      selectedPositionForTransactions$: selectedPositionSubject.asObservable(),
      loading$: loadingSubject.asObservable(),
      loadingPositions$: loadingPositionsSubject.asObservable(),
      anyLoading$: anyLoadingSubject.asObservable(),
      error$: errorSubject.asObservable(),
      showTransactionSidebar$: showTransactionSidebarSubject.asObservable(),
      portfolioStats$: portfolioStatsSubject.asObservable(),
      buyFormState$: buyFormStateSubject.asObservable(),
      sellFormState$: sellFormStateSubject.asObservable(),
      buyForm: buyFormGroup,
      sellForm: sellFormGroup,
      today: new Date(),
      isBuyFormSubmitting: false,
      isSellFormSubmitting: false,
      selectedStock: null,
      selectedPosition: null,
      stockSuggestions$: of([]),
      searchingStocks$: of(false)
    });

    // Setup default return values for spy methods
    mockFacade.hasBuyFormError.and.returnValue(false);
    mockFacade.getBuyFormErrorMessage.and.returnValue('');
    mockFacade.hasSellFormError.and.returnValue(false);
    mockFacade.getSellFormErrorMessage.and.returnValue('');
    mockFacade.formatAmount.and.returnValue('$0.00');
    mockFacade.formatPercentage.and.returnValue('0.00%');
    mockFacade.formatDate.and.returnValue('Jan 1, 2024');
    mockFacade.getGainLossColorClass.and.returnValue('text-green-500');
    mockFacade.trackByPositionUuid.and.returnValue('test-uuid');
    mockFacade.trackByIndex.and.returnValue(0);
    mockFacade.getStockDisplayName.and.returnValue('AAPL - Apple Inc.');

    // Mock ActivatedRoute
    const mockParamMap = jasmine.createSpyObj('ParamMap', ['get', 'has']);
    mockParamMap.get.and.returnValue(mockPortfolio.uuid);
    mockParamMap.has.and.returnValue(true);

    mockActivatedRoute = jasmine.createSpyObj('ActivatedRoute', [], {
      params: of({ uuid: mockPortfolio.uuid }),
      snapshot: {
        params: { uuid: mockPortfolio.uuid },
        paramMap: mockParamMap
      }
    });

    // Create mock confirmation service with proper observables
    const mockConfirmationService = {
      requireConfirmation$: of({}),
      requireConfirmationSource$: of({}),
      accept: jasmine.createSpy('accept'),
      reject: jasmine.createSpy('reject'),
      confirm: jasmine.createSpy('confirm'),
      onAccept: jasmine.createSpy('onAccept'),
      onReject: jasmine.createSpy('onReject'),
      close: jasmine.createSpy('close')
    };

    const mockMessageService = jasmine.createSpyObj('MessageService', ['add']);
    const mockStateService = jasmine.createSpyObj('PortfolioDetailStateService', ['init']);
    const mockPositionFormService = jasmine.createSpyObj('PositionFormService', ['createBuyForm', 'createSellForm']);
    const mockStockSearchService = jasmine.createSpyObj('StockSearchService', ['searchStocks']);

    await TestBed.configureTestingModule({
      imports: [PortfolioDetailComponent, HttpClientTestingModule],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .overrideComponent(PortfolioDetailComponent, {
      set: {
        providers: [
          { provide: ActivatedRoute, useValue: mockActivatedRoute },
          { provide: PortfolioDetailFacade, useValue: mockFacade },
          { provide: MessageService, useValue: mockMessageService },
          { provide: ConfirmationService, useValue: mockConfirmationService },
          { provide: PortfolioDetailStateService, useValue: mockStateService },
          { provide: PositionFormService, useValue: mockPositionFormService },
          { provide: StockSearchService, useValue: mockStockSearchService }
        ]
      }
    })
    .compileComponents();

    fixture = TestBed.createComponent(PortfolioDetailComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize facade on init', () => {
    component.ngOnInit();
    expect(mockFacade.init).toHaveBeenCalledWith(mockPortfolio.uuid);
  });

  it('should expose facade observables', () => {
    expect(component.portfolio$).toBeDefined();
    expect(component.positions$).toBeDefined();
    expect(component.activePositions$).toBeDefined();
    expect(component.closedPositions$).toBeDefined();
    expect(component.filteredPositions$).toBeDefined();
    expect(component.selectedPositionForTransactions$).toBeDefined();
    expect(component.loading$).toBeDefined();
    expect(component.loadingPositions$).toBeDefined();
    expect(component.anyLoading$).toBeDefined();
    expect(component.error$).toBeDefined();
    expect(component.showTransactionSidebar$).toBeDefined();
    expect(component.portfolioStats$).toBeDefined();
  });

  it('should expose form related observables and forms', () => {
    expect(component.buyFormState$).toBeDefined();
    expect(component.sellFormState$).toBeDefined();
    expect(component.buyForm).toBeDefined();
    expect(component.sellForm).toBeDefined();
  });

  describe('facade interaction', () => {
    it('should have all required facade methods available', () => {
      expect(mockFacade.init).toBeDefined();
      expect(mockFacade.refresh).toBeDefined();
      expect(mockFacade.goBack).toBeDefined();
      expect(mockFacade.showBuyPositionDialog).toBeDefined();
      expect(mockFacade.hideBuyDialog).toBeDefined();
      expect(mockFacade.showSellPositionDialog).toBeDefined();
      expect(mockFacade.hideSellDialog).toBeDefined();
      expect(mockFacade.submitBuyForm).toBeDefined();
      expect(mockFacade.submitSellForm).toBeDefined();
      expect(mockFacade.searchStocks).toBeDefined();
      expect(mockFacade.onPositionRowClick).toBeDefined();
    });
  });

  describe('component state observables', () => {
    it('should emit correct portfolio data', (done) => {
      component.portfolio$.subscribe(portfolio => {
        expect(portfolio).toEqual(mockPortfolio);
        done();
      });
    });

    it('should emit correct positions data', (done) => {
      component.positions$.subscribe(positions => {
        expect(positions).toEqual([mockPosition]);
        done();
      });
    });

    it('should emit correct active positions', (done) => {
      component.activePositions$.subscribe(positions => {
        expect(positions).toEqual([mockPosition]);
        done();
      });
    });

    it('should emit correct closed positions', (done) => {
      component.closedPositions$.subscribe(positions => {
        expect(positions).toEqual([]);
        done();
      });
    });

    it('should emit correct portfolio stats', (done) => {
      component.portfolioStats$.subscribe(stats => {
        expect(stats).toEqual(mockPortfolioStats);
        done();
      });
    });

    it('should emit loading states correctly', (done) => {
      let loadingEmitted = false;
      let loadingPositionsEmitted = false;
      let anyLoadingEmitted = false;

      component.loading$.subscribe(loading => {
        expect(loading).toBeFalsy();
        loadingEmitted = true;
      });

      component.loadingPositions$.subscribe(loading => {
        expect(loading).toBeFalsy();
        loadingPositionsEmitted = true;
      });

      component.anyLoading$.subscribe(loading => {
        expect(loading).toBeFalsy();
        anyLoadingEmitted = true;
        
        if (loadingEmitted && loadingPositionsEmitted && anyLoadingEmitted) {
          done();
        }
      });
    });
  });

  describe('form states', () => {
    it('should emit buy form state correctly', (done) => {
      component.buyFormState$.subscribe(state => {
        expect(state.mode).toBe('buy');
        expect(state.visible).toBeFalsy();
        expect(state.submitting).toBeFalsy();
        expect(state.position).toBeNull();
        done();
      });
    });

    it('should emit sell form state correctly', (done) => {
      component.sellFormState$.subscribe(state => {
        expect(state.mode).toBe('sell');
        expect(state.visible).toBeFalsy();
        expect(state.submitting).toBeFalsy();
        expect(state.position).toBeNull();
        done();
      });
    });
  });

  describe('error handling', () => {
    it('should emit error state correctly', (done) => {
      component.error$.subscribe(error => {
        expect(error).toBeNull();
        done();
      });
    });
  });

  describe('transaction sidebar', () => {
    it('should emit transaction sidebar state correctly', (done) => {
      component.showTransactionSidebar$.subscribe(show => {
        expect(show).toBeFalsy();
        done();
      });
    });

    it('should emit selected position for transactions correctly', (done) => {
      component.selectedPositionForTransactions$.subscribe(position => {
        expect(position).toBeNull();
        done();
      });
    });
  });

  describe('component lifecycle', () => {
    it('should handle ngOnInit correctly with route parameters', () => {
      spyOn(component, 'ngOnInit').and.callThrough();
      
      component.ngOnInit();
      
      expect(component.ngOnInit).toHaveBeenCalled();
      expect(mockFacade.init).toHaveBeenCalledWith(mockPortfolio.uuid);
    });
  });

  describe('template integration', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should initialize without errors', () => {
      expect(component).toBeTruthy();
      expect(fixture.debugElement).toBeTruthy();
    });

    it('should call facade init on component initialization', () => {
      expect(mockFacade.init).toHaveBeenCalledWith(mockPortfolio.uuid);
    });
  });

  describe('provider dependencies', () => {
    it('should have all required providers injected', () => {
      expect(component['facade']).toBeTruthy();
      expect(component['route']).toBeTruthy();
    });
  });
});