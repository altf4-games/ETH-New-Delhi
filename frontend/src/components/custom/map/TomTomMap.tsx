import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './TomTomMap.css';

interface TomTomMapProps {
  width?: string;
  height?: string;
  className?: string;
  center?: [number, number]; // [longitude, latitude]
  zoom?: number;
}

interface ZoneMarker {
  id: string;
  coordinates: [number, number];
  type: 'owned' | 'available' | 'others';
  title: string;
}

const TOMTOM_API_KEY = 'oP7TR9pF4oKO35fN8MQ1uD3mQIiaHx1z';

export default function TomTomMap({ 
  width = '100%', 
  height = '100%', 
  className = '',
  center = [77.2090, 28.6139], // Default to Delhi coordinates
  zoom = 12
}: TomTomMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Sample zone data - replace with real data from your backend
  const zones: ZoneMarker[] = [
    {
      id: '1',
      coordinates: [77.2090, 28.6139], // Delhi
      type: 'owned',
      title: 'Connaught Place Zone'
    },
    {
      id: '2',
      coordinates: [77.2300, 28.6280], // Near Delhi
      type: 'available',
      title: 'India Gate Zone'
    },
    {
      id: '3',
      coordinates: [77.1910, 28.5355], // South Delhi
      type: 'others',
      title: 'Hauz Khas Zone'
    },
    {
      id: '4',
      coordinates: [77.2500, 28.6500], // North Delhi
      type: 'available',
      title: 'Red Fort Zone'
    },
    {
      id: '5',
      coordinates: [77.1800, 28.6100], // West Delhi
      type: 'owned',
      title: 'Karol Bagh Zone'
    }
  ];

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    // Initialize map with correct TomTom style URL
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'tomtom-raster': {
            type: 'raster',
            tiles: [
              `https://api.tomtom.com/map/1/tile/basic/main/{z}/{x}/{y}.png?key=${TOMTOM_API_KEY}`
            ],
            tileSize: 256,
            attribution: '© TomTom'
          }
        },
        layers: [
          {
            id: 'tomtom-tiles',
            type: 'raster',
            source: 'tomtom-raster',
            minzoom: 0,
            maxzoom: 22
          }
        ]
      },
      center: center,
      zoom: zoom,
      attributionControl: false
    });

    // Add TomTom attribution
    map.current.addControl(new maplibregl.AttributionControl({
      customAttribution: '© TomTom'
    }));

    // Add navigation controls
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      setIsMapLoaded(true);
    });

    // Cleanup function
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [center, zoom]);

  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    // Add markers for zones
    zones.forEach((zone) => {
      // Create a custom marker element
      const markerEl = document.createElement('div');
      markerEl.className = 'zone-marker';
      markerEl.style.width = '20px';
      markerEl.style.height = '20px';
      markerEl.style.borderRadius = '2px';
      markerEl.style.border = '2px solid #000';
      markerEl.style.cursor = 'pointer';
      
      // Set color based on zone type
      switch (zone.type) {
        case 'owned':
          markerEl.style.backgroundColor = '#0ea5a4'; // Teal
          break;
        case 'available':
          markerEl.style.backgroundColor = '#d1d5db'; // Gray
          break;
        case 'others':
          markerEl.style.backgroundColor = '#ec4899'; // Pink
          break;
      }

      // Create popup
      const popup = new maplibregl.Popup({ 
        offset: 25,
        className: 'zone-popup'
      }).setHTML(`
        <div class="p-2 font-bold">
          <h3 class="text-sm font-black uppercase">${zone.title}</h3>
          <p class="text-xs">
            ${zone.type === 'owned' ? '✅ Owned by you' : 
              zone.type === 'available' ? '🏃 Available to capture' : 
              '🔒 Owned by others'}
          </p>
        </div>
      `);

      // Add marker to map
      new maplibregl.Marker(markerEl)
        .setLngLat(zone.coordinates)
        .setPopup(popup)
        .addTo(map.current!);
    });

    // Add click handler for zone interaction
    map.current.on('click', (e) => {
      console.log('Map clicked at:', e.lngLat);
      // You can add zone interaction logic here
    });

  }, [isMapLoaded]);

  return (
    <div 
      ref={mapContainer} 
      className={`tomtom-map ${className}`}
      style={{ width, height }}
    />
  );
}