import type { ControlPosition, IControl, Map, MapLibreEvent } from 'maplibre-gl';

export interface LayerGroup {
  id: string;
  title: string;
  layers: string[];
  visible?: boolean;
  mutuallyExclusive?: boolean;
}

export interface LayerMetadata {
  title?: string;
  group?: string;
}

export interface LegendControlOptions {
  groups?: LayerGroup[];
  className?: string;
}

export class LegendControl implements IControl {
  _groups: LayerGroup[];
  _map?: Map;
  _container?: HTMLElement;

  constructor(public options: LegendControlOptions = {}) {
    this._groups = options.groups ?? [];
  }

  onAdd(map: Map): HTMLElement {
    this._map = map;
    this._container = document.createElement('div');
    this._container.className = this.options.className ?? 'maplibregl-ctrl maplibregl-ctrl-legend';

    this._map.on('styledata', this._update);

    return this._container;
  }

  onRemove(): void {
    this._container?.remove();
    this._map?.off('styledata', this._update);

    this._map = undefined;
    this._container = undefined;
  }

  getDefaultPosition(): ControlPosition {
    return 'bottom-left';
  }

  _update = (
    e: MapLibreEvent<unknown> & {
      dataType: 'style';
    } & object,
  ) => {
    const map = e.target;
    const layerIds = map.getLayersOrder();
    const groups: Record<string, LayerGroup> = (this.options.groups ?? []).reduce(
      (acc, group) => {
        acc[group.id] = group;
        return acc;
      },
      {} as Record<string, LayerGroup>,
    );
    layerIds.forEach(id => {
      const layer = map.getLayer(id);
      if (!layer) return;
      const groupName = (layer.metadata as LayerMetadata)?.group;
      if (!groupName) return;
      const layerGroup = groups[groupName] ?? { id: groupName, title: groupName, layers: [] };
      layerGroup.layers.push(id);
    });
  };
}
