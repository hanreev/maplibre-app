'use client';

import '@watergis/maplibre-gl-legend/dist/maplibre-gl-legend.css';
import 'maplibre-gl/dist/maplibre-gl.css';

import chroma from 'chroma-js';
import clsx from 'clsx';
import _ from 'lodash';
import maplibregl from 'maplibre-gl';
import type { MiniMapOptions } from 'maplibregl-minimap';
import MinimapControl from 'maplibregl-minimap';
import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';
import { toast } from 'sonner';

import { LegendControl } from '@/lib/control/LegendControl';
import { MousePositionControl } from '@/lib/control/MousePositionControl';
import type { BasemapPreset } from '@/lib/map/basemap-style';
import { basemapPresets, basemapStyle } from '@/lib/map/basemap-style';
import { cast } from '@/lib/utils';
import { MaplibreLegendControl } from '@watergis/maplibre-gl-legend';

interface Props {
  ref?: React.RefObject<{ mapRef: React.RefObject<maplibregl.Map | null> }>;
  className?: string;
}

const minimapOptions: MiniMapOptions = {
  id: 'minimap',
  width: '300px',
  height: '200px',
};

const Map: React.FC<Props> = ({ ref, className = 'flex-1' }) => {
  const mapRef = useRef<maplibregl.Map>(null);
  const minimapRef = useRef<MinimapControl>(null);

  const [basemapPreset, setBasemapPreset] = useState<BasemapPreset>('esri-hybrid');

  useImperativeHandle(
    ref,
    () => ({
      mapRef,
    }),
    [],
  );

  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    const minimap = minimapRef.current
      ? cast<{ _minimap: maplibregl.Map }>(minimapRef.current)._minimap
      : undefined;

    const layerIds = basemapPresets[basemapPreset];
    basemapStyle.layers.forEach(layer => {
      const visibility = layerIds.includes(layer.id) ? 'visible' : 'none';
      map.setLayoutProperty(layer.id, 'visibility', visibility);
      minimap?.setLayoutProperty(layer.id, 'visibility', visibility);
    });
  }, [basemapPreset]);

  useEffect(() => {
    const map = new maplibregl.Map({
      container: 'map',
      style: basemapStyle,
      center: [110.3644, -7.8041],
      zoom: 9,
      attributionControl: false,
    });

    map.addControl(
      new maplibregl.AttributionControl({
        customAttribution: [],
        compact: true,
      }),
      'bottom-right',
    );
    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.addControl(new maplibregl.GlobeControl(), 'top-right');
    map.addControl(new maplibregl.ScaleControl(), 'bottom-left');
    map.addControl(new MousePositionControl(), 'bottom-right');
    map.addControl(
      new maplibregl.GeolocateControl({
        fitBoundsOptions: {
          zoom: 18,
          duration: 1000,
        },
        showUserLocation: true,
      }),
      'top-right',
    );

    minimapRef.current = new MinimapControl({
      ...minimapOptions,
      style: basemapStyle,
    });
    map.addControl(minimapRef.current, 'bottom-left');

    map.on('load', () => {
      console.log('map loaded');

      map.addControl(
        new MaplibreLegendControl(
          {},
          { showDefault: true, showCheckbox: true, reverseOrder: true, onlyRendered: false },
        ),
        'bottom-right',
      );

      map.addControl(new LegendControl(), 'bottom-right');

      map.addSource('smca-getas', {
        type: 'vector',
        tiles: [
          'https://server2.karomap.com/geoserver/gwc/service/tms/1.0.0/simerakati-getas:SMCA Getas@EPSG:900913@pbf/{z}/{x}/{y}.pbf?flipY=true',
        ],
        maxzoom: 14,
        bounds: [111.3234622710313, -7.382109061396001, 111.46195546778138, -7.254336658274222],
      });

      const popup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
      });

      const colorPalette = chroma.scale(['red', 'yellow', 'green']).colors(3);
      const colorMap = {
        rendah: colorPalette[0],
        sedang: colorPalette[1],
        tinggi: colorPalette[2],
      };

      for (const klass in colorMap) {
        const layerId = `smca-getas-${klass}`;

        map.addLayer({
          id: layerId,
          metadata: {
            group: 'SMCA Getas',
            title: `SMCA Getas - ${_.capitalize(klass)}`,
          },
          type: 'fill',
          source: 'smca-getas',
          'source-layer': 'SMCA Getas',
          filter: ['==', 'kelas', klass],
          paint: {
            'fill-color': colorMap[klass as keyof typeof colorMap],
            'fill-opacity': 0.5,
            'fill-outline-color': '#000000',
          },
        });

        map.on('mousemove', layerId, e => {
          const feature = e.features?.[0];
          if (!feature) return;
          map.getCanvas().style.cursor = 'pointer';
          popup
            .setLngLat(e.lngLat)
            .setHTML(
              `<div class="text-sm text-black grid grid-cols-2 gap-x-2">
              <div>ID</div>
              <div>: ${feature.id}</div>
              <div>Kelas</div>
              <div>: ${feature.properties.kelas}</div>
              <div>Luas</div>
              <div>: ${feature.properties.luas.toFixed(2)} km<sup>2</sup></div>
            </div>`,
            )
            .addTo(map);
        });

        map.on('mouseleave', layerId, () => {
          map.getCanvas().style.cursor = '';
          popup.remove();
        });
      }
    });

    map.once('idle', () => {
      const source = map.getSource<maplibregl.VectorTileSource>('smca-getas');
      if (source?.bounds) {
        const bounds = maplibregl.LngLatBounds.convert(source.bounds);
        if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: 100 });
      }
    });

    map.on('click', e => {
      console.log(e.lngLat, e.point);
      toast.info(`${e.lngLat.lng}, ${e.lngLat.lat}`);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div className={clsx(className, 'flex flex-col min-h-[400px] relative')}>
      <div id="map" className="flex-1"></div>
      <div className="absolute top-4 left-4 bg-secondary text-secondary-foreground rounded ring-2 ring-black/20 dark:ring-white/20 overflow-hidden flex">
        {Object.keys(basemapPresets).map((preset, i) => (
          <button
            key={preset}
            onClick={() => {
              setBasemapPreset(preset as BasemapPreset);
            }}
            className={clsx('px-4 py-2 cursor-pointer capitalize', {
              'bg-secondary-foreground/20': basemapPreset === preset,
              'border-l border-black/20': i > 0,
            })}
          >
            {preset.replaceAll('-', ' ')}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Map;
