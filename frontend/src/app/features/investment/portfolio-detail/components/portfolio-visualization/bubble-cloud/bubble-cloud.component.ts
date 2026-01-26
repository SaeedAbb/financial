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
  OnDestroy
} from '@angular/core';
import { CommonModule, DecimalPipe, CurrencyPipe } from '@angular/common';
import { VisualizationStock, BubbleData } from '../../../models/visualization.model';
import { VisualizationDataService } from '../../../services/visualization-data.service';

/**
 * Bubble cloud component for displaying portfolio as interactive bubbles.
 * Uses custom SVG rendering with circle packing algorithm.
 */
@Component({
  selector: 'app-bubble-cloud',
  standalone: true,
  imports: [CommonModule, DecimalPipe, CurrencyPipe],
  providers: [VisualizationDataService],
  templateUrl: './bubble-cloud.component.html',
  styleUrl: './bubble-cloud.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BubbleCloudComponent implements AfterViewInit, OnDestroy {
  private readonly dataService = inject(VisualizationDataService);

  stocks = input.required<VisualizationStock[]>();
  stockSelected = output<VisualizationStock>();

  @ViewChild('container') container!: ElementRef<HTMLDivElement>;

  private resizeObserver?: ResizeObserver;

  width = signal(800);
  height = signal(400);
  hoveredBubble = signal<BubbleData | null>(null);
  tooltipPos = signal({ x: 0, y: 0 });

  bubbles = computed(() =>
    this.dataService.toBubbleData(this.stocks(), this.width(), this.height())
  );

  ngAfterViewInit(): void {
    this.updateDimensions();
    this.setupResizeObserver();
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

  onBubbleHover(bubble: BubbleData): void {
    this.hoveredBubble.set(bubble);
    this.tooltipPos.set({ x: bubble.x, y: bubble.y - bubble.r });
  }

  onBubbleClick(bubble: BubbleData): void {
    this.stockSelected.emit(bubble.stock);
  }

  onLogoError(event: Event, bubble: BubbleData): void {
    const img = event.target as SVGImageElement;
    img.style.display = 'none';
    bubble.stock.logoFailed = true;
  }

  onTooltipLogoError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }

  /**
   * Lighten a hex color for gradient effect
   */
  lightenColor(hex: string): string {
    // Handle HSL colors
    if (hex.startsWith('hsl')) {
      return hex.replace(/(\d+)%\)$/, (_, l) => `${Math.min(100, parseInt(l) + 20)}%)`);
    }

    // Handle hex colors
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, ((num >> 16) & 0xFF) + 50);
    const g = Math.min(255, ((num >> 8) & 0xFF) + 50);
    const b = Math.min(255, (num & 0xFF) + 50);
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  }
}
