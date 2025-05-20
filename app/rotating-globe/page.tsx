'use client';

import 'mapbox-gl/dist/mapbox-gl.css';

import type { StyleSpecification } from 'mapbox-gl';
import mapboxgl from 'mapbox-gl';
import { useEffect } from 'react';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

const defaultStyle: StyleSpecification = {
  version: 8,
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
  },
  layers: [
    {
      id: 'ESRI Satellite',
      type: 'raster',
      source: 'esri-satellite',
      layout: { visibility: 'visible' },
    },
    {
      id: 'Google Label',
      type: 'raster',
      source: 'google-label',
      layout: { visibility: 'visible' },
    },
  ],
};

export default function RotatingGlobe() {
  useEffect(() => {
    const map = new mapboxgl.Map({
      container: 'map2',
      projection: 'globe',
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [110, 0],
      zoom: 1.5,
    });

    map.on('style.load', () => {
      map.setFog({});
    });

    // The following values can be changed to control rotation speed:

    // At low zooms, complete a revolution every two minutes.
    const secondsPerRevolution = 120;
    // Above zoom level 5, do not rotate.
    const maxSpinZoom = 5;
    // Rotate at intermediate speeds between zoom levels 3 and 5.
    const slowSpinZoom = 3;

    let userInteracting = false;
    const spinEnabled = true;

    function spinGlobe() {
      const zoom = map.getZoom();
      if (spinEnabled && !userInteracting && zoom < maxSpinZoom) {
        let distancePerSecond = 360 / secondsPerRevolution;
        if (zoom > slowSpinZoom) {
          // Slow spinning at higher zooms
          const zoomDif = (maxSpinZoom - zoom) / (maxSpinZoom - slowSpinZoom);
          distancePerSecond *= zoomDif;
        }
        const center = map.getCenter();
        center.lng -= distancePerSecond;
        // Smoothly animate the map over one second.
        // When this animation is complete, it calls a 'moveend' event.
        map.easeTo({ center, duration: 1000, easing: n => n });
      }
    }
    // Pause spinning on interaction
    map.on('mousedown', () => {
      userInteracting = true;
    });

    // Restart spinning the globe when interaction is complete
    map.on('mouseup', () => {
      userInteracting = false;
      spinGlobe();
    });

    // These events account for cases where the mouse has moved
    // off the map, so 'mouseup' will not be fired.
    map.on('dragend', () => {
      userInteracting = false;
      spinGlobe();
    });
    map.on('pitchend', () => {
      userInteracting = false;
      spinGlobe();
    });
    map.on('rotateend', () => {
      userInteracting = false;
      spinGlobe();
    });

    // When animation is complete, start spinning if there is no ongoing interaction
    map.on('moveend', () => {
      spinGlobe();
    });

    spinGlobe();

    return () => {
      map.remove();
    };
  }, []);

  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col">
      <div id="map2" className="flex-1"></div>
    </div>
  );
}
