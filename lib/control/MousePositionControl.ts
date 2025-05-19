import './mouse-position-control.css';

import type { ControlPosition, IControl, Map, MapMouseEvent } from 'maplibre-gl';

export interface MousePositionControlOptions {
  precision?: number;
  className?: string;
}

export class MousePositionControl implements IControl {
  _map?: Map;
  _container?: HTMLElement;

  constructor(public options: MousePositionControlOptions = {}) {}

  onAdd(map: Map): HTMLElement {
    this._map = map;
    this._container = document.createElement('div');
    this._container.className =
      this.options.className ?? 'maplibregl-ctrl maplibregl-ctrl-mouse-position';

    this._map.on('mousemove', this._update);

    return this._container;
  }

  onRemove(): void {
    this._container?.remove();
    this._map?.off('mousemove', this._update);

    this._map = undefined;
    this._container = undefined;
  }

  getDefaultPosition(): ControlPosition {
    return 'bottom-right';
  }

  _update = (e: MapMouseEvent) => {
    if (!this._container) {
      return;
    }
    const { lat, lng } = e.lngLat;
    const precision = this.options.precision ?? 8;
    const coordinate = `${lat.toFixed(precision)}, ${lng.toFixed(precision)}`;
    this._container.textContent = coordinate;
  };
}
