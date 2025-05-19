import type { StyleSpecification } from 'maplibre-gl';

export const basemapStyle: StyleSpecification = {
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
    'google-label': {
      type: 'raster',
      tiles: [
        'https://mt0.google.com/vt/lyrs=h&x={x}&y={y}&z={z}',
        'https://mt1.google.com/vt/lyrs=h&x={x}&y={y}&z={z}',
        'https://mt2.google.com/vt/lyrs=h&x={x}&y={y}&z={z}',
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
      id: 'ESRI Satellite',
      type: 'raster',
      source: 'esri-satellite',
      layout: { visibility: 'visible' },
      metadata: { group: 'basemap' },
    },
    {
      id: 'Google Satellite',
      type: 'raster',
      source: 'google-satellite',
      layout: { visibility: 'none' },
      metadata: { group: 'basemap' },
    },
    {
      id: 'Google Label',
      type: 'raster',
      source: 'google-label',
      layout: { visibility: 'visible' },
      metadata: { group: 'basemap' },
    },
    {
      id: 'Google Roads',
      type: 'raster',
      source: 'google-roads',
      layout: { visibility: 'none' },
      metadata: { group: 'basemap' },
    },
    {
      id: 'Google Terrain',
      type: 'raster',
      source: 'google-terrain',
      layout: { visibility: 'none' },
      metadata: { group: 'basemap' },
    },
  ],
};

export const basemapPresets = {
  'esri-hybrid': ['ESRI Satellite', 'Google Label'],
  'esri-satellite': ['ESRI Satellite'],
  'google-hybrid': ['Google Satellite', 'Google Label'],
  'google-satellite': ['Google Satellite'],
  'google-roads': ['Google Roads'],
  'google-terrain': ['Google Terrain'],
};

export type BasemapPreset = keyof typeof basemapPresets;
