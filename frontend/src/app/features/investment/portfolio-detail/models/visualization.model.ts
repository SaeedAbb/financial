/**
 * Portfolio Visualization Models
 * Types and interfaces for treemap, donut, and bubble visualizations
 */

export type VisualizationType = 'treemap' | 'donut' | 'bubble';

export interface VisualizationConfig {
  type: VisualizationType;
  label: string;
  icon: string;
  description: string;
}

export const VISUALIZATION_OPTIONS: readonly VisualizationConfig[] = [
  { type: 'treemap', label: 'Treemap', icon: 'pi pi-th-large', description: 'Hierarchical view by value' },
  { type: 'donut', label: 'Allocation', icon: 'pi pi-chart-pie', description: 'Portfolio allocation breakdown' },
  { type: 'bubble', label: 'Bubble Cloud', icon: 'pi pi-circle', description: 'Interactive bubble visualization' }
] as const;

/**
 * Processed stock data for visualization
 */
export interface VisualizationStock {
  symbol: string;
  companyName: string;
  currentValue: number;
  percentage: number;
  gainLoss: number;
  gainLossPercentage: number;
  color: string;
  logoUrl: string;
  logoFailed: boolean;
}

/**
 * Treemap layout node with position and dimensions
 */
export interface TreemapNode {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  data: VisualizationStock;
}

/**
 * Bubble data with position and radius
 */
export interface BubbleData {
  x: number;
  y: number;
  r: number;
  stock: VisualizationStock;
}

/**
 * Donut chart data structure for PrimeNG Chart
 */
export interface DonutChartData {
  labels: string[];
  datasets: {
    data: number[];
    backgroundColor: string[];
    borderColor: string;
    borderWidth: number;
    hoverBorderColor: string;
    hoverBorderWidth: number;
  }[];
}
