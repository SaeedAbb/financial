import { Injectable, inject } from '@angular/core';
import { PortfolioPosition, PositionStatus } from '../../../../core/models/portfolio-position.model';
import { VisualizationStock, TreemapNode, BubbleData, DonutChartData } from '../models/visualization.model';
import { ColorPaletteService } from './color-palette.service';

/**
 * Service for transforming portfolio position data into visualization-ready formats.
 * Handles data preparation for treemap, donut, and bubble charts.
 */
@Injectable()
export class VisualizationDataService {
  private readonly colorPalette = inject(ColorPaletteService);

  private readonly FINNHUB_LOGO_URL = 'https://static2.finnhub.io/file/publicdatany/finnhubimage/stock_logo/';

  /**
   * Transform portfolio positions into visualization stocks.
   * Filters for active positions only and calculates percentages.
   *
   * @param positions Array of portfolio positions
   * @returns Array of visualization stocks
   */
  transformPositions(positions: PortfolioPosition[]): VisualizationStock[] {
    const activePositions = positions.filter(p => p.status === PositionStatus.ACTIVE);

    if (activePositions.length === 0) {
      return [];
    }

    // Calculate total value for percentage calculation
    const totalValue = activePositions.reduce(
      (sum, p) => sum + (p.currentValue ?? p.totalCost),
      0
    );

    // Get symbols and generate color palette
    const symbols = activePositions.map(p => p.stock.symbol);
    const colorPalette = this.colorPalette.generatePalette(symbols);

    // Transform each position to visualization stock
    return activePositions.map(position => {
      const currentValue = position.currentValue ?? position.totalCost;
      const percentage = totalValue > 0 ? (currentValue / totalValue) * 100 : 0;

      return {
        symbol: position.stock.symbol,
        companyName: position.stock.companyName,
        currentValue,
        percentage,
        gainLoss: position.unrealizedGainLoss ?? 0,
        gainLossPercentage: position.unrealizedGainLossPercentage ?? 0,
        color: colorPalette.get(position.stock.symbol) ?? this.colorPalette.getDefaultColor(),
        logoUrl: `${this.FINNHUB_LOGO_URL}${position.stock.symbol}.png`,
        logoFailed: false
      };
    }).sort((a, b) => b.currentValue - a.currentValue); // Sort by value descending
  }

  /**
   * Transform visualization stocks into treemap layout nodes.
   * Uses the squarified treemap algorithm for optimal aspect ratios.
   *
   * @param stocks Array of visualization stocks
   * @param width Container width
   * @param height Container height
   * @returns Array of treemap nodes with positions
   */
  toTreemapData(stocks: VisualizationStock[], width: number, height: number): TreemapNode[] {
    if (stocks.length === 0 || width <= 0 || height <= 0) {
      return [];
    }

    const totalValue = stocks.reduce((sum, s) => sum + s.currentValue, 0);
    if (totalValue <= 0) {
      return [];
    }

    // Normalize values to fill the container area
    const normalizedStocks = stocks.map(stock => ({
      ...stock,
      normalizedValue: (stock.currentValue / totalValue) * width * height
    }));

    return this.squarify(normalizedStocks, 0, 0, width, height);
  }

  /**
   * Transform visualization stocks into donut chart data for PrimeNG Chart.
   *
   * @param stocks Array of visualization stocks
   * @returns DonutChartData for PrimeNG chart component
   */
  toDonutData(stocks: VisualizationStock[]): DonutChartData {
    return {
      labels: stocks.map(s => s.symbol),
      datasets: [{
        data: stocks.map(s => s.currentValue),
        backgroundColor: stocks.map(s => s.color),
        borderColor: 'var(--surface-border)',
        borderWidth: 2,
        hoverBorderColor: 'var(--primary-color)',
        hoverBorderWidth: 3
      }]
    };
  }

  /**
   * Transform visualization stocks into bubble data with positions.
   * Uses a spiral packing algorithm for positioning.
   *
   * @param stocks Array of visualization stocks
   * @param width Container width
   * @param height Container height
   * @returns Array of bubble data with positions
   */
  toBubbleData(stocks: VisualizationStock[], width: number, height: number): BubbleData[] {
    if (stocks.length === 0 || width <= 0 || height <= 0) {
      return [];
    }

    const maxValue = Math.max(...stocks.map(s => s.currentValue));
    const minRadius = 30;
    const maxRadius = Math.min(width, height) * 0.18;

    // Calculate radii based on value (area-proportional)
    const bubblesWithRadius = stocks.map(stock => ({
      stock,
      r: this.calculateRadius(stock.currentValue, maxValue, minRadius, maxRadius)
    }));

    return this.packBubbles(bubblesWithRadius, width, height);
  }

  /**
   * Calculate bubble radius based on value.
   * Uses square root scaling so area is proportional to value.
   */
  private calculateRadius(value: number, maxValue: number, minRadius: number, maxRadius: number): number {
    if (maxValue <= 0) return minRadius;
    const ratio = Math.sqrt(value / maxValue);
    return minRadius + (maxRadius - minRadius) * ratio;
  }

  /**
   * Pack bubbles using a spiral algorithm with collision detection.
   */
  private packBubbles(bubbles: { stock: VisualizationStock; r: number }[], width: number, height: number): BubbleData[] {
    const centerX = width / 2;
    const centerY = height / 2;
    const result: BubbleData[] = [];

    // Sort by radius descending for better packing
    const sorted = [...bubbles].sort((a, b) => b.r - a.r);
    const padding = 8;

    sorted.forEach((bubble, index) => {
      let placed = false;
      let x = centerX;
      let y = centerY;

      if (index === 0) {
        // Place first bubble at center
        placed = true;
      } else {
        // Use spiral placement with collision detection
        const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // Golden angle in radians
        let radius = 0;
        let angle = 0;

        for (let attempt = 0; attempt < 500 && !placed; attempt++) {
          angle = attempt * goldenAngle;
          radius = 10 + attempt * 3;

          x = centerX + Math.cos(angle) * radius;
          y = centerY + Math.sin(angle) * radius;

          // Check bounds
          if (x - bubble.r < padding || x + bubble.r > width - padding ||
              y - bubble.r < padding || y + bubble.r > height - padding) {
            continue;
          }

          // Check collision with existing bubbles
          let collision = false;
          for (const existing of result) {
            const dx = x - existing.x;
            const dy = y - existing.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDist = bubble.r + existing.r + padding;

            if (distance < minDist) {
              collision = true;
              break;
            }
          }

          if (!collision) {
            placed = true;
          }
        }

        // Fallback: place at edge if no valid position found
        if (!placed) {
          const fallbackAngle = index * goldenAngle;
          x = centerX + Math.cos(fallbackAngle) * (width * 0.3);
          y = centerY + Math.sin(fallbackAngle) * (height * 0.3);

          // Clamp to bounds
          x = Math.max(bubble.r + padding, Math.min(width - bubble.r - padding, x));
          y = Math.max(bubble.r + padding, Math.min(height - bubble.r - padding, y));
        }
      }

      result.push({ x, y, r: bubble.r, stock: bubble.stock });
    });

    return result;
  }

  /**
   * Squarified treemap algorithm implementation.
   * Creates rectangles with aspect ratios as close to 1 as possible.
   */
  private squarify(
    stocks: (VisualizationStock & { normalizedValue: number })[],
    x: number,
    y: number,
    width: number,
    height: number
  ): TreemapNode[] {
    if (stocks.length === 0 || width <= 0 || height <= 0) {
      return [];
    }

    // If only one item, it takes the full area
    if (stocks.length === 1) {
      return [{
        x,
        y,
        width,
        height,
        color: stocks[0].color,
        data: stocks[0]
      }];
    }

    const nodes: TreemapNode[] = [];
    const remaining = [...stocks];
    let currentX = x;
    let currentY = y;
    let currentWidth = width;
    let currentHeight = height;

    while (remaining.length > 0) {
      // Determine layout direction (horizontal or vertical split)
      const isHorizontal = currentWidth >= currentHeight;

      // Calculate how many items to place in current row/column
      const row: (VisualizationStock & { normalizedValue: number })[] = [];
      let rowValue = 0;
      const totalRemaining = remaining.reduce((sum, s) => sum + s.normalizedValue, 0);

      // Target about half the remaining area for this row
      const targetValue = totalRemaining / 2;

      for (let i = 0; i < remaining.length && rowValue < targetValue; i++) {
        row.push(remaining[i]);
        rowValue += remaining[i].normalizedValue;
      }

      // Ensure at least one item in row
      if (row.length === 0 && remaining.length > 0) {
        row.push(remaining[0]);
        rowValue = remaining[0].normalizedValue;
      }

      // Calculate row dimensions
      const rowRatio = rowValue / totalRemaining;
      const rowSize = isHorizontal
        ? currentWidth * rowRatio
        : currentHeight * rowRatio;

      // Place items in the row
      let offset = 0;
      for (const item of row) {
        const itemRatio = item.normalizedValue / rowValue;
        const itemSize = isHorizontal
          ? currentHeight * itemRatio
          : currentWidth * itemRatio;

        const node: TreemapNode = isHorizontal
          ? {
              x: currentX,
              y: currentY + offset,
              width: rowSize,
              height: itemSize,
              color: item.color,
              data: item
            }
          : {
              x: currentX + offset,
              y: currentY,
              width: itemSize,
              height: rowSize,
              color: item.color,
              data: item
            };

        nodes.push(node);
        offset += itemSize;
      }

      // Update remaining area
      if (isHorizontal) {
        currentX += rowSize;
        currentWidth -= rowSize;
      } else {
        currentY += rowSize;
        currentHeight -= rowSize;
      }

      // Remove placed items
      remaining.splice(0, row.length);
    }

    return nodes;
  }
}
