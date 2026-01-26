import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  computed,
  signal,
  inject,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { CommonModule, DecimalPipe, CurrencyPipe } from '@angular/common';
import { VisualizationStock, TreemapNode } from '../../../models/visualization.model';
import { VisualizationDataService } from '../../../services/visualization-data.service';

/**
 * Treemap chart component for displaying portfolio composition.
 * Uses custom SVG rendering with squarified layout algorithm.
 */
@Component({
  selector: 'app-treemap-chart',
  standalone: true,
  imports: [CommonModule, DecimalPipe, CurrencyPipe],
  providers: [VisualizationDataService],
  templateUrl: './treemap-chart.component.html',
  styleUrl: './treemap-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TreemapChartComponent implements AfterViewInit, OnDestroy, OnChanges {
  private readonly dataService = inject(VisualizationDataService);

  stocks = input.required<VisualizationStock[]>();
  stockSelected = output<VisualizationStock>();

  @ViewChild('container') container!: ElementRef<HTMLDivElement>;

  private resizeObserver?: ResizeObserver;

  width = signal(800);
  height = signal(400);
  hoveredNode = signal<TreemapNode | null>(null);
  tooltipPos = signal({ x: 0, y: 0 });

  nodes = computed(() =>
    this.dataService.toTreemapData(this.stocks(), this.width(), this.height())
  );

  ngAfterViewInit(): void {
    this.updateDimensions();
    this.setupResizeObserver();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['stocks'] && !changes['stocks'].firstChange) {
      // Recalculate on stock changes
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  private updateDimensions(): void {
    if (this.container) {
      const rect = this.container.nativeElement.getBoundingClientRect();
      this.width.set(Math.max(400, rect.width));
    }
  }

  private setupResizeObserver(): void {
    this.resizeObserver = new ResizeObserver(entries => {
      const { width } = entries[0].contentRect;
      this.width.set(Math.max(400, width));
    });
    this.resizeObserver.observe(this.container.nativeElement);
  }

  onNodeHover(node: TreemapNode): void {
    this.hoveredNode.set(node);

    const x = node.x + node.width / 2;
    const y = node.y;

    this.tooltipPos.set({ x, y });
  }

  onNodeClick(node: TreemapNode): void {
    this.stockSelected.emit(node.data);
  }

  onLogoError(event: Event, node: TreemapNode): void {
    const img = event.target as SVGImageElement;
    img.style.display = 'none';
    node.data.logoFailed = true;
  }

  onTooltipLogoError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }

  formatValue(value: number): string {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toFixed(0);
  }
}
