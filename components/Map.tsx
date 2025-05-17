'use client';

import '@watergis/maplibre-gl-legend/dist/maplibre-gl-legend.css';
import 'maplibre-gl/dist/maplibre-gl.css';

import clsx from 'clsx';
import _ from 'lodash';
import maplibregl, {
  RasterLayerSpecification,
  StyleOptions,
  StyleSpecification,
  StyleSwapOptions,
} from 'maplibre-gl';
import MinimapControl, { MiniMapOptions } from 'maplibregl-minimap';
import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';
import { toast } from 'sonner';

import esriHybridStyle from '@/assets/styles/esri-hybrid.json';
import { MousePositionControl } from '@/lib/controls/MousePositionControl';
import { MaplibreLegendControl } from '@watergis/maplibre-gl-legend';

interface Props {
  ref?: React.RefObject<{ mapRef: React.RefObject<maplibregl.Map | null> }>;
  className?: string;
}

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
      id: 'Basemap',
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

    const legendControl = map._controls.find(c => c instanceof MaplibreLegendControl);
    legendControl?.redraw();
  };

  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;

    if (basemapPreset === 'esri-hybrid') {
      setStyle(map, esriHybridStyle as StyleSpecification);
      return;
    }

    if (Object.keys(basemapStyle.sources).includes(basemapPreset)) {
      const style = JSON.parse(JSON.stringify(basemapStyle)) as StyleSpecification;
      style.sources = {
        [basemapPreset]: style.sources[basemapPreset],
      };
      const layerSpec = style.layers[0] as RasterLayerSpecification;
      layerSpec.source = basemapPreset;
      layerSpec.id = _.startCase(basemapPreset.replaceAll('-', ' '));
      setStyle(map, style);
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
        {basemapPresets.map((preset, i) => (
          <button
            key={preset}
            onClick={() => {
              setBasemapPreset(preset);
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
