import { Component, ChangeDetectionStrategy, input, output, computed, signal } from '@angular/core';
import { CommonModule, DecimalPipe, CurrencyPipe } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { VisualizationStock, DonutChartData } from '../../../models/visualization.model';

/**
 * Donut chart component for displaying portfolio allocation.
 * Uses PrimeNG Chart (Chart.js) with a custom legend showing stock logos.
 */
@Component({
  selector: 'app-donut-chart',
  standalone: true,
  imports: [CommonModule, ChartModule, DecimalPipe, CurrencyPipe],
  templateUrl: './donut-chart.component.html',
  styleUrl: './donut-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DonutChartComponent {
  stocks = input.required<VisualizationStock[]>();
  stockSelected = output<VisualizationStock>();

  hoveredSymbol = signal<string | null>(null);

  totalValue = computed(() =>
    this.stocks().reduce((sum, s) => sum + s.currentValue, 0)
  );

  chartData = computed((): DonutChartData => ({
    labels: this.stocks().map(s => s.symbol),
    datasets: [{
      data: this.stocks().map(s => s.currentValue),
      backgroundColor: this.stocks().map(s => s.color),
      borderColor: 'var(--surface-ground)',
      borderWidth: 2,
      hoverBorderColor: 'var(--primary-color)',
      hoverBorderWidth: 3
    }]
  }));

  chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    plugins: {
      legend: {
        display: false // We use custom legend
      },
      tooltip: {
        callbacks: {
          label: (context: { dataIndex: number; formattedValue: string }) => {
            const stock = this.stocks()[context.dataIndex];
            return [
              `${stock.symbol}: ${context.formattedValue} EUR`,
              `Allocation: ${stock.percentage.toFixed(1)}%`,
              `${stock.gainLoss >= 0 ? '+' : ''}${stock.gainLoss.toFixed(2)} EUR (${stock.gainLossPercentage.toFixed(2)}%)`
            ];
          }
        }
      }
    },
    animation: {
      animateRotate: true,
      animateScale: true
    }
  };

  selectStock(stock: VisualizationStock): void {
    this.stockSelected.emit(stock);
  }

  onLogoError(event: Event, stock: VisualizationStock): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    stock.logoFailed = true;
  }
}
