import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { AccordionModule } from 'primeng/accordion';
import { TextareaModule } from 'primeng/textarea';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { PaginatorModule } from 'primeng/paginator';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Observable } from 'rxjs';
import { PortfolioPosition } from '../../../core/models/portfolio-position.model';
import { StockMaster } from '../../../core/models/stock-master.model';
import { TransactionSidebarComponent } from '../components/transaction-sidebar/transaction-sidebar.component';
import { PortfolioDetailStateService } from './state/portfolio-detail.state';
import { PortfolioDetailFacade } from './state/portfolio-detail.facade';
import { PositionFormService } from './services/position-form.service';
import { StockSearchService } from './services/stock-search.service';

/**
 * Portfolio Detail Component
 * Refactored to follow Angular best practices with:
 * - OnPush change detection for better performance
 * - Facade pattern for clean component API
 * - State management separated from component
 * - All business logic moved to services
 * - Async pipe used throughout template
 */
@Component({
  selector: 'app-portfolio-detail',
  standalone: true,
  templateUrl: './portfolio-detail.component.html',
  styleUrls: ['./portfolio-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    CardModule,
    ButtonModule,
    MessageModule,
    TableModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    DatePickerModule,
    ToastModule,
    ConfirmDialogModule,
    ProgressSpinnerModule,
    TagModule,
    TooltipModule,
    SkeletonModule,
    AccordionModule,
    TextareaModule,
    AutoCompleteModule,
    PaginatorModule,
    TransactionSidebarComponent
  ],
  providers: [
    MessageService,
    ConfirmationService,
    PortfolioDetailStateService,
    PortfolioDetailFacade,
    PositionFormService,
    StockSearchService
  ]
})
export class PortfolioDetailComponent implements OnInit {
  protected readonly facade = inject(PortfolioDetailFacade);
  private readonly route = inject(ActivatedRoute);
  
  // Expose observables for template
  readonly portfolio$ = this.facade.portfolio$;
  readonly positions$ = this.facade.positions$;
  readonly activePositions$ = this.facade.activePositions$;
  readonly closedPositions$ = this.facade.closedPositions$;
  readonly filteredPositions$ = this.facade.filteredPositions$;
  readonly selectedPositionForTransactions$ = this.facade.selectedPositionForTransactions$;
  readonly loading$ = this.facade.loading$;
  readonly loadingPositions$ = this.facade.loadingPositions$;
  readonly anyLoading$ = this.facade.anyLoading$;
  readonly error$ = this.facade.error$;
  readonly showTransactionSidebar$ = this.facade.showTransactionSidebar$;
  readonly portfolioStats$ = this.facade.portfolioStats$;
  
  // Form related
  readonly buyFormState$ = this.facade.buyFormState$;
  readonly sellFormState$ = this.facade.sellFormState$;
  readonly buyForm = this.facade.buyForm;
  readonly sellForm = this.facade.sellForm;
  readonly today = this.facade.today;
  
  // Stock search
  readonly stockSuggestions$ = this.facade.stockSuggestions$;
  readonly searchingStocks$ = this.facade.searchingStocks$;
  
  ngOnInit(): void {
    const portfolioUuid = this.route.snapshot.paramMap.get('uuid');
    if (portfolioUuid) {
      this.facade.init(portfolioUuid);
    }
  }
  
  /**
   * Search stocks for autocomplete
   */
  searchStocks(event: { query: string }): void {
    this.facade.searchStocks(event.query);
  }
  
  /**
   * Track by function for positions
   */
  trackByPositionId(index: number, position: PortfolioPosition): string {
    return position.uuid;
  }
  
  /**
   * Handle stock logo loading errors
   */
  onStockLogoError(event: Event, symbol: string): void {
    const img = event.target as HTMLImageElement;
    // Create a fallback with the first letter of the symbol
    img.style.display = 'none';
    const wrapper = img.parentElement;
    if (wrapper) {
      wrapper.innerHTML = `<div class="stock-logo-fallback">${symbol.charAt(0)}</div>`;
    }
  }
}