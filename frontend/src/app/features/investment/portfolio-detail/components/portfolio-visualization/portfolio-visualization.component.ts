import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  computed,
  signal,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { SkeletonModule } from 'primeng/skeleton';
import { PortfolioPosition } from '../../../../../core/models/portfolio-position.model';
import { VisualizationType, VisualizationStock } from '../../models/visualization.model';
import { VisualizationDataService } from '../../services/visualization-data.service';
import { ViewSelectorComponent } from './view-selector/view-selector.component';
import { TreemapChartComponent } from './treemap-chart/treemap-chart.component';
import { DonutChartComponent } from './donut-chart/donut-chart.component';
import { BubbleCloudComponent } from './bubble-cloud/bubble-cloud.component';

/**
 * Main portfolio visualization container component.
 * Provides a card with view selector and renders the selected visualization type.
 */
@Component({
  selector: 'app-portfolio-visualization',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    SkeletonModule,
    ViewSelectorComponent,
    TreemapChartComponent,
    DonutChartComponent,
    BubbleCloudComponent
  ],
  templateUrl: './portfolio-visualization.component.html',
  styleUrl: './portfolio-visualization.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [VisualizationDataService]
})
export class PortfolioVisualizationComponent {
  private readonly dataService = inject(VisualizationDataService);

  positions = input<PortfolioPosition[]>([]);
  loading = input<boolean>(false);
  stockSelected = output<string>();

  currentView = signal<VisualizationType>('treemap');

  visualizationStocks = computed(() =>
    this.dataService.transformPositions(this.positions())
  );

  stockCount = computed(() => this.visualizationStocks().length);

  onStockSelected(stock: VisualizationStock): void {
    this.stockSelected.emit(stock.symbol);
  }
}
