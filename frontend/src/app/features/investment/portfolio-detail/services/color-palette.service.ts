import { Injectable } from '@angular/core';

/**
 * Service for generating consistent color palettes for stock visualizations.
 * Uses a deterministic approach to ensure the same stock always gets the same color.
 */
@Injectable({ providedIn: 'root' })
export class ColorPaletteService {
  private readonly DEFAULT_COLOR = '#FFFFFF';

  /**
   * Base color palette with visually distinct, vibrant colors
   * These colors work well on both light and dark backgrounds
   */
  private readonly BASE_COLORS: readonly string[] = [
    '#3B82F6', // Blue
    '#8B5CF6', // Violet
    '#EC4899', // Pink
    '#F59E0B', // Amber
    '#14B8A6', // Teal
    '#F97316', // Orange
    '#6366F1', // Indigo
    '#22C55E', // Green
    '#EAB308', // Yellow
    '#06B6D4', // Cyan
    '#10B981', // Emerald
    '#A855F7', // Purple
    '#EF4444', // Red (use sparingly, mainly for losses)
    '#84CC16', // Lime
    '#0EA5E9', // Sky
    '#D946EF', // Fuchsia
  ];

  /**
   * Cache colors by symbol for consistency across views and re-renders
   */
  private readonly colorCache = new Map<string, string>();

  /**
   * Generate a color palette for a list of stock symbols.
   * Each symbol will receive a unique, consistent color.
   *
   * @param symbols Array of stock symbols
   * @returns Map of symbol to color
   */
  generatePalette(symbols: string[]): Map<string, string> {
    const palette = new Map<string, string>();

    symbols.forEach((symbol, index) => {
      if (this.colorCache.has(symbol)) {
        palette.set(symbol, this.colorCache.get(symbol)!);
      } else {
        const color = this.getColorForIndex(index, symbols.length);
        this.colorCache.set(symbol, color);
        palette.set(symbol, color);
      }
    });

    return palette;
  }

  /**
   * Get a single color for a stock symbol.
   * Uses cached color if available, otherwise generates based on symbol hash.
   *
   * @param symbol Stock symbol
   * @returns Color string
   */
  getColorForSymbol(symbol: string): string {
    if (this.colorCache.has(symbol)) {
      return this.colorCache.get(symbol)!;
    }

    // Generate color based on symbol hash for consistency
    const hash = this.hashCode(symbol);
    const index = Math.abs(hash) % this.BASE_COLORS.length;
    const color = this.BASE_COLORS[index];

    this.colorCache.set(symbol, color);
    return color;
  }

  /**
   * Get color for a specific index in a palette.
   * Uses base colors first, then generates intermediate hues for larger palettes.
   *
   * @param index Position in the palette
   * @param total Total number of items
   * @returns Color string
   */
  private getColorForIndex(index: number, total: number): string {
    if (total <= this.BASE_COLORS.length) {
      return this.BASE_COLORS[index % this.BASE_COLORS.length];
    }

    // For larger palettes, generate evenly distributed colors using HSL
    const hue = (index * 360 / total) % 360;
    const saturation = 70 + (index % 3) * 10; // Vary saturation slightly
    const lightness = 50 + (index % 2) * 10; // Vary lightness slightly

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }

  /**
   * Get color based on gain/loss value.
   * Green for gains, red for losses, gray for neutral.
   *
   * @param gainLoss Gain/loss value
   * @returns Color string
   */
  getPerformanceColor(gainLoss: number): string {
    if (gainLoss > 0) return '#10B981'; // Green
    if (gainLoss < 0) return '#EF4444'; // Red
    return '#6B7280'; // Gray
  }

  /**
   * Get the default color (white)
   */
  getDefaultColor(): string {
    return this.DEFAULT_COLOR;
  }

  /**
   * Clear the color cache.
   * Useful for testing or when colors need to be regenerated.
   */
  clearCache(): void {
    this.colorCache.clear();
  }

  /**
   * Simple hash function for strings.
   * Used to generate consistent colors for symbols.
   */
  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  }
}
