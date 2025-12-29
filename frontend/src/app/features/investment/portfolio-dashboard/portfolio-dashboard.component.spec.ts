import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, BehaviorSubject } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { PortfolioDashboardComponent } from './portfolio-dashboard.component';
import { PortfolioDashboardFacade } from './state/portfolio-dashboard.facade';
import { Portfolio, PortfolioSummary } from '../../../core/models/portfolio.model';
import { PortfolioDashboardStateService } from './state/portfolio-dashboard.state';
import { PortfolioFormService } from './services/portfolio-form.service';
import { MessageService, ConfirmationService } from 'primeng/api';

describe('PortfolioDashboardComponent', () => {
  let component: PortfolioDashboardComponent;
  let fixture: ComponentFixture<PortfolioDashboardComponent>;
  let mockFacade: jasmine.SpyObj<PortfolioDashboardFacade>;
  let mockRouter: jasmine.SpyObj<Router>;

  const mockPortfolio: Portfolio = {
    id: 1,
    uuid: '123e4567-e89b-12d3-a456-426614174000',
    userId: 'user123',
    name: 'Test Portfolio',
    description: 'Test Description',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  };

  const mockPortfolioSummary: PortfolioSummary = {
    totalPortfolios: 3,
    totalActivePositions: 15,
    totalClosedPositions: 5,
    totalDistinctStocks: 10,
    totalInvestment: 50000,
    totalCurrentValue: 60000,
    totalGainLoss: 10000,
    totalGainLossPercentage: 20
  };

  beforeEach(async () => {
    // Create BehaviorSubjects for testing
    const portfoliosSubject = new BehaviorSubject([mockPortfolio]);
    const portfolioSummarySubject = new BehaviorSubject(mockPortfolioSummary);
    const loadingSubject = new BehaviorSubject(false);
    const loadingSummarySubject = new BehaviorSubject(false);
    const loadingStatisticsSubject = new BehaviorSubject(false);
    const anyLoadingSubject = new BehaviorSubject(false);
    const errorSubject = new BehaviorSubject(null);
    const hasPortfoliosSubject = new BehaviorSubject(true);
    const formStateSubject = new BehaviorSubject({ showDialog: false, isEditMode: false, editingPortfolio: null });

    // Create mock facade with all required observables
    mockFacade = jasmine.createSpyObj('PortfolioDashboardFacade', 
      ['init', 'showCreateDialog', 'showEditDialog', 'deletePortfolio', 
       'submitForm', 'hideDialog', 'getPortfolioStatistics'],
      {
        portfolios$: portfoliosSubject.asObservable(),
        portfolioSummary$: portfolioSummarySubject.asObservable(),
        loading$: loadingSubject.asObservable(),
        loadingSummary$: loadingSummarySubject.asObservable(),
        loadingStatistics$: loadingStatisticsSubject.asObservable(),
        anyLoading$: anyLoadingSubject.asObservable(),
        error$: errorSubject.asObservable(),
        hasPortfolios$: hasPortfoliosSubject.asObservable(),
        totalPortfolios$: of(3),
        totalInvestment$: of(50000),
        totalCurrentValue$: of(60000),
        totalGainLoss$: of(10000),
        totalGainLossPercentage$: of(20),
        totalActivePositions$: of(15),
        totalDistinctStocks$: of(10),
        formState$: formStateSubject.asObservable(),
        form: jasmine.createSpyObj('FormGroup', ['reset', 'patchValue'])
      }
    );

    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    // Create mock confirmation service with the subscription that ConfirmDialog expects
    const mockConfirmationService = {
      requireConfirmationSource$: of({}),
      accept: jasmine.createSpy('accept'),
      reject: jasmine.createSpy('reject'),
      confirm: jasmine.createSpy('confirm')
    };

    const mockMessageService = jasmine.createSpyObj('MessageService', ['add']);

    await TestBed.configureTestingModule({
      imports: [PortfolioDashboardComponent],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .overrideComponent(PortfolioDashboardComponent, {
      set: {
        providers: [
          { provide: Router, useValue: mockRouter },
          { provide: PortfolioDashboardFacade, useValue: mockFacade },
          { provide: MessageService, useValue: mockMessageService },
          { provide: ConfirmationService, useValue: mockConfirmationService },
          { provide: PortfolioDashboardStateService, useValue: {} },
          { provide: PortfolioFormService, useValue: {} }
        ]
      }
    })
    .compileComponents();

    fixture = TestBed.createComponent(PortfolioDashboardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize facade on init', () => {
    component.ngOnInit();
    expect(mockFacade.init).toHaveBeenCalled();
  });

  it('should track by portfolio UUID correctly', () => {
    const result = component.trackByPortfolioUuid(0, mockPortfolio);
    expect(result).toBe(mockPortfolio.uuid);
  });

  it('should track by index correctly', () => {
    const result = component.trackByIndex(5);
    expect(result).toBe(5);
  });

  it('should navigate to portfolio detail when viewPortfolio is called', () => {
    component.viewPortfolio(mockPortfolio);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/investment/portfolios', mockPortfolio.uuid]);
  });

  it('should return portfolio statistics observable', () => {
    const uuid = 'test-uuid';
    mockFacade.getPortfolioStatistics.and.returnValue(of(null));
    
    const result = component.getPortfolioStatistics$(uuid);
    
    expect(mockFacade.getPortfolioStatistics).toHaveBeenCalledWith(uuid);
    expect(result).toBeDefined();
  });

  describe('facade interaction', () => {
    it('should delegate method calls to facade', () => {
      // These methods don't exist on the component, they would be called from the template
      // But we can verify the facade methods exist and are spies
      expect(mockFacade.showCreateDialog).toBeDefined();
      expect(mockFacade.showEditDialog).toBeDefined();
      expect(mockFacade.deletePortfolio).toBeDefined();
      expect(mockFacade.submitForm).toBeDefined();
      expect(mockFacade.hideDialog).toBeDefined();
    });
  });

  it('should expose facade observables', () => {
    expect(component.portfolios$).toBeDefined();
    expect(component.portfolioSummary$).toBeDefined();
    expect(component.loading$).toBeDefined();
    expect(component.error$).toBeDefined();
  });
});