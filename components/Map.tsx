'use client';

import 'maplibre-gl/dist/maplibre-gl.css';
import '@watergis/maplibre-gl-legend/dist/maplibre-gl-legend.css';

import classNames from 'classnames';
import maplibregl, {
  RasterLayerSpecification,
  StyleOptions,
  StyleSpecification,
  StyleSwapOptions,
} from 'maplibre-gl';
import MinimapControl, { MiniMapOptions } from 'maplibregl-minimap';
import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';

import esriHybridStyle from '@/assets/styles/esri-hybrid.json';
import { MaplibreLegendControl } from '@watergis/maplibre-gl-legend';

interface Props {
  ref?: React.RefObject<{ mapRef: React.RefObject<maplibregl.Map | null> }>;
  className?: string;
}

// mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!;

const basemapStyle: StyleSpecification = {
  version: 8,
  name: 'Basemap',
  projection: { type: 'globe' },
  sources: {
    'esri-satellite': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      maxzoom: 18,
      attribution: '<a href="https://www.esri.com" target="_blank">&copy; Esri</a>',
    },
    'google-roads': {
      type: 'raster',
      tiles: [
        'https://mt0.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
        'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
        'https://mt2.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
      ],
      tileSize: 256,
      attribution: '<a href="https://www.google.com/maps" target="_blank">&copy; Google Maps</a>',
    },
    'google-terrain': {
      type: 'raster',
      tiles: [
        'https://mt0.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
        'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
        'https://mt2.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
      ],
      tileSize: 256,
      attribution: '<a href="https://www.google.com/maps" target="_blank">&copy; Google Maps</a>',
    },
    'google-hybrid': {
      type: 'raster',
      tiles: [
        'https://mt0.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
        'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
        'https://mt2.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
      ],
      tileSize: 256,
      attribution: '<a href="https://www.google.com/maps" target="_blank">&copy; Google Maps</a>',
    },
    'google-satellite': {
      type: 'raster',
      tiles: [
        'https://mt0.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
        'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
        'https://mt2.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
      ],
      tileSize: 256,
      attribution: '<a href="https://www.google.com/maps" target="_blank">&copy; Google Maps</a>',
    },
  },
  layers: [
    {
      id: 'basemap',
      type: 'raster',
      source: 'esri-satellite',
    },
  ],
};

const basemapPresets = ['esri-hybrid', ...Object.keys(basemapStyle.sources)];

const minimapOptions: MiniMapOptions = {
  id: 'minimap',
  width: '300px',
  height: '200px',
};

const Map: React.FC<Props> = ({ ref, className = 'flex-1' }) => {
  const mapRef = useRef<maplibregl.Map>(null);
  const minimapRef = useRef<MinimapControl>(null);

  const [basemapPreset, setBasemapPreset] = useState<string>(basemapPresets[0]);

  useImperativeHandle(
    ref,
    () => ({
      mapRef,
    }),
    [],
  );

  const setStyle = (
    map: maplibregl.Map,
    style: StyleSpecification | string | null,
    options?: StyleSwapOptions & StyleOptions,
  ) => {
    map.setStyle(style, options);

    if (minimapRef.current) map.removeControl(minimapRef.current);
    minimapRef.current = new MinimapControl({
      ...minimapOptions,
      style: map.getStyle(),
    });
    map.addControl(minimapRef.current, 'bottom-left');
  };

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (basemapPreset === 'esri-hybrid') {
      setStyle(map, esriHybridStyle as StyleSpecification);
      return;
    }

    if (Object.keys(basemapStyle.sources).includes(basemapPreset)) {
      const basemapStyle$ = JSON.parse(JSON.stringify(basemapStyle)) as StyleSpecification;
      (basemapStyle$.layers[0] as RasterLayerSpecification).source = basemapPreset;
      setStyle(map, basemapStyle$);
      return;
    }
  }, [basemapPreset]);

  useEffect(() => {
    const map = new maplibregl.Map({
      container: 'map',
      style: esriHybridStyle as StyleSpecification,
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

    minimapRef.current = new MinimapControl({
      ...minimapOptions,
      style: esriHybridStyle as StyleSpecification,
    });
    map.addControl(minimapRef.current, 'bottom-left');

    map.on('load', () => {
      console.log('map loaded');

      map.addControl(
        new MaplibreLegendControl(
          {},
          { showDefault: true, showCheckbox: true, reverseOrder: false, onlyRendered: false },
        ),
        'bottom-right',
      );
    });

    map.on('click', e => {
      console.log(e.lngLat, e.point);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div className={classNames(className, 'flex flex-col min-h-[400px] relative')}>
      <div id="map" className="flex-1"></div>
      <div className="absolute top-4 left-4 bg-white text-black dark:bg-gray-900 dark:text-white rounded ring-2 ring-black/20 dark:ring-white/20 overflow-hidden flex">
        {basemapPresets.map((preset, i) => (
          <button
            key={preset}
            onClick={() => {
              setBasemapPreset(preset);
            }}
            className={classNames('px-4 py-2 cursor-pointer capitalize', {
              'bg-blue-200 dark:bg-gray-600': basemapPreset === preset,
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
