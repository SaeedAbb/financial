import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TooltipModule } from 'primeng/tooltip';
import { VisualizationType, VISUALIZATION_OPTIONS, VisualizationConfig } from '../../../models/visualization.model';

/**
 * View selector component for switching between visualization types.
 * Displays a segmented button group with icons and labels.
 */
@Component({
  selector: 'app-view-selector',
  standalone: true,
  imports: [CommonModule, TooltipModule],
  templateUrl: './view-selector.component.html',
  styleUrl: './view-selector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewSelectorComponent {
  readonly options: readonly VisualizationConfig[] = VISUALIZATION_OPTIONS;

  selectedView = input<VisualizationType>('treemap');
  viewChange = output<VisualizationType>();

  onViewChange(type: VisualizationType): void {
    this.viewChange.emit(type);
  }
}
