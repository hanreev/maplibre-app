import './legend-control.css';

import type { ControlPosition, IControl, Map, MapLibreEvent, TypedStyleLayer } from 'maplibre-gl';

export interface LayerGroup {
  id: string;
  title: string;
  layers: (string | TypedStyleLayer)[];
  visible?: boolean;
  mutuallyExclusive?: boolean;
}

export interface LayerMetadata {
  title?: string;
  group?: string;
}

export interface LegendControlOptions {
  title?: string;
  groups?: LayerGroup[];
  className?: string;
}

export class LegendControl implements IControl {
  _groups: LayerGroup[];
  _map?: Map;
  _container?: HTMLElement;
  _listElement?: HTMLElement;

  constructor(public options: LegendControlOptions = {}) {
    this._groups = options.groups ?? [];
  }

  onAdd(map: Map): HTMLElement {
    this._map = map;

    this._container = document.createElement('div');
    this._container.className = this.options.className ?? 'maplibregl-ctrl maplibregl-ctrl-legend';

    const titleEL = document.createElement('h3');
    titleEL.className = 'px-4 mb-2 font-semibold text-lg';
    titleEL.textContent = this.options.title ?? 'Legend';
    this._container.append(titleEL);

    this._listElement = document.createElement('div');
    this._listElement.className = 'flex flex-col';
    this._container.append(this._listElement);

    this._update(map);
    this._map.on('styledata', this._onstyledata);

    return this._container;
  }

  onRemove(): void {
    this._container?.remove();
    this._map?.off('styledata', this._onstyledata);

    this._map = undefined;
    this._container = undefined;
  }

  getDefaultPosition(): ControlPosition {
    return 'bottom-left';
  }

  _onstyledata = (
    e: MapLibreEvent<unknown> & {
      dataType: 'style';
    } & object,
  ) => {
    this._update(e.target);
  };

  _createItemElement({
    text,
    className,
    visible,
    legend,
    onChecked,
  }: {
    text: string | HTMLElement;
    className?: string;
    visible?: boolean;
    legend?: HTMLElement;
    onChecked?: (checked: boolean) => void;
  }) {
    const itemEl = document.createElement('div');
    itemEl.className = className ?? 'px-4 py-1 flex items-center gap-2';
    const cbxEl = document.createElement('input');
    cbxEl.type = 'checkbox';
    cbxEl.checked = visible ?? false;
    if (onChecked)
      cbxEl.addEventListener('click', e => {
        onChecked((e.target as HTMLInputElement).checked);
      });
    itemEl.append(cbxEl);
    if (legend) itemEl.append(legend);
    itemEl.append(text);

    return itemEl;
  }

  _createGroupElement(group: LayerGroup) {
    const groupEl = document.createElement('div');
    groupEl.className = 'flex flex-col';
    const groupItemEl = this._createItemElement({
      text: group.title,
      visible: group.visible,
      onChecked: checked => {
        this._toggleVisibility(group.id, checked);
      },
    });
    groupEl.append(groupItemEl);

    group.layers.forEach(layer => {
      const styleLayer = typeof layer === 'string' ? this._map?.getLayer(layer) : layer;
      if (!styleLayer) return;

      const meta = styleLayer.metadata as LayerMetadata;

      let legend: HTMLElement | undefined;
      if (styleLayer.type === 'raster') {
        const img = new Image(24, 24);
        img.src = '/globe.svg';
        legend = img;
      }

      groupEl.append(
        this._createItemElement({
          className: 'pl-8 pr-4 py-1 flex items-center gap-2',
          text: meta.title ?? styleLayer.id,
          legend,
          visible: (styleLayer.visibility ?? 'visible') === 'visible',
          onChecked: checked => {
            this._map?.setLayoutProperty(styleLayer.id, 'visibility', checked ? 'visible' : 'none');
          },
        }),
      );
    });

    return groupEl;
  }

  _toggleVisibility(id: string, visible?: boolean) {
    const group = this._groups.find(g => g.id === id);
    if (!group) return;
    group.visible = visible ?? !group.visible;
    group.layers.forEach(layer => {
      const layerId = typeof layer === 'string' ? layer : layer.id;
      this._map?.setLayoutProperty(layerId, 'visibility', group.visible ? 'visible' : 'none');
    });
  }

  _update(map: Map) {
    const layerIds = map.getLayersOrder();
    const groups: Record<string, LayerGroup> = this._groups.reduce(
      (acc, group) => {
        acc[group.id] = group;
        return acc;
      },
      {} as Record<string, LayerGroup>,
    );
    layerIds.forEach(id => {
      const layer = map.getLayer(id) as TypedStyleLayer | undefined;
      if (!layer) return;
      const groupName = (layer.metadata as LayerMetadata)?.group;
      if (!groupName) return;
      groups[groupName] ??= {
        id: groupName,
        title: groupName,
        layers: [],
        visible: true,
        mutuallyExclusive: false,
      };
      const group = groups[groupName];
      let idx = group.layers.indexOf(layer.id);
      if (idx === -1) idx = group.layers.indexOf(layer);
      if (idx !== -1) {
        group.layers[idx] = layer;
      } else {
        group.layers.push(layer);
      }
    });
    this._groups = Object.values(groups);

    if (!this._listElement) return;
    this._listElement.innerHTML = '';
    this._groups.forEach(group => {
      this._listElement?.append(this._createGroupElement(group));
    });
  }
}
