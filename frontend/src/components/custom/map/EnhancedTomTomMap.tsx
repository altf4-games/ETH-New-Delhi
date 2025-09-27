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
  onZoneClick?: (zone: ZoneMarker) => void;
}

export interface ZoneMarker {
  id: string;
  coordinates: [number, number];
  type: 'owned' | 'available' | 'others';
  title: string;
  points?: number;
  distance?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
}

const TOMTOM_API_KEY = 'oP7TR9pF4oKO35fN8MQ1uD3mQIiaHx1z';

export default function TomTomMap({ 
  width = '100%', 
  height = '100%', 
  className = '',
  center = [77.2090, 28.6139], // Default to Delhi coordinates
  zoom = 12,
  onZoneClick
}: TomTomMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  // Sample zone data - replace with real data from your backend
  const zones: ZoneMarker[] = [
    {
      id: '1',
      coordinates: [77.2090, 28.6139], // Delhi
      type: 'owned',
      title: 'Connaught Place Zone',
      points: 500,
      distance: 0,
      difficulty: 'medium'
    },
    {
      id: '2',
      coordinates: [77.2300, 28.6280], // Near Delhi
      type: 'available',
      title: 'India Gate Zone',
      points: 750,
      distance: 2.3,
      difficulty: 'easy'
    },
    {
      id: '3',
      coordinates: [77.1910, 28.5355], // South Delhi
      type: 'others',
      title: 'Hauz Khas Zone',
      points: 650,
      distance: 8.5,
      difficulty: 'hard'
    },
    {
      id: '4',
      coordinates: [77.2500, 28.6500], // North Delhi
      type: 'available',
      title: 'Red Fort Zone',
      points: 800,
      distance: 4.2,
      difficulty: 'medium'
    },
    {
      id: '5',
      coordinates: [77.1800, 28.6100], // West Delhi
      type: 'owned',
      title: 'Karol Bagh Zone',
      points: 450,
      distance: 0,
      difficulty: 'easy'
    },
    {
      id: '6',
      coordinates: [77.2200, 28.6000], // Central Delhi
      type: 'available',
      title: 'Lodhi Gardens Zone',
      points: 900,
      distance: 3.1,
      difficulty: 'hard'
    }
  ];

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: [number, number] = [
            position.coords.longitude,
            position.coords.latitude
          ];
          setUserLocation(location);
          
          // Center map on user location if available
          if (map.current) {
            map.current.flyTo({
              center: location,
              zoom: 14,
              duration: 2000
            });
          }
        },
        (error) => {
          console.warn('Could not get user location:', error);
        }
      );
    }
  }, []);

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
      center: userLocation || center,
      zoom: zoom,
      attributionControl: false
    });

    // Add TomTom attribution
    map.current.addControl(new maplibregl.AttributionControl({
      customAttribution: '© TomTom'
    }));

    // Add navigation controls
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    // Add geolocation control
    map.current.addControl(new maplibregl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true
    }), 'top-right');

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
  }, [center, zoom, userLocation]);

  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add user location marker if available
    if (userLocation) {
      const userMarkerEl = document.createElement('div');
      userMarkerEl.className = 'user-location-marker';
      userMarkerEl.style.width = '16px';
      userMarkerEl.style.height = '16px';
      userMarkerEl.style.borderRadius = '50%';
      userMarkerEl.style.border = '3px solid #fff';
      userMarkerEl.style.backgroundColor = '#3b82f6';
      userMarkerEl.style.boxShadow = '0 0 10px rgba(59, 130, 246, 0.6)';

      const userMarker = new maplibregl.Marker(userMarkerEl)
        .setLngLat(userLocation)
        .addTo(map.current!);
      
      markersRef.current.push(userMarker);
    }

    // Add markers for zones
    zones.forEach((zone) => {
      // Create a custom marker element
      const markerEl = document.createElement('div');
      markerEl.className = 'zone-marker';
      markerEl.style.width = '24px';
      markerEl.style.height = '24px';
      markerEl.style.borderRadius = '4px';
      markerEl.style.border = '3px solid #000';
      markerEl.style.cursor = 'pointer';
      markerEl.style.display = 'flex';
      markerEl.style.alignItems = 'center';
      markerEl.style.justifyContent = 'center';
      markerEl.style.fontWeight = 'bold';
      markerEl.style.fontSize = '10px';
      markerEl.style.color = 'white';
      
      // Set color based on zone type
      switch (zone.type) {
        case 'owned':
          markerEl.style.backgroundColor = '#0ea5a4'; // Teal
          markerEl.innerHTML = '✓';
          break;
        case 'available':
          markerEl.style.backgroundColor = '#10b981'; // Green
          markerEl.innerHTML = '🏃';
          break;
        case 'others':
          markerEl.style.backgroundColor = '#ec4899'; // Pink
          markerEl.innerHTML = '🔒';
          break;
      }

      // Add difficulty indicator
      const difficultyColors = {
        easy: '#22c55e',
        medium: '#f59e0b',
        hard: '#ef4444'
      };

      const difficultyDot = document.createElement('div');
      difficultyDot.style.position = 'absolute';
      difficultyDot.style.top = '-2px';
      difficultyDot.style.right = '-2px';
      difficultyDot.style.width = '8px';
      difficultyDot.style.height = '8px';
      difficultyDot.style.borderRadius = '50%';
      difficultyDot.style.backgroundColor = difficultyColors[zone.difficulty || 'medium'];
      difficultyDot.style.border = '1px solid #000';
      markerEl.style.position = 'relative';
      markerEl.appendChild(difficultyDot);

      // Create enhanced popup
      const popup = new maplibregl.Popup({ 
        offset: 25,
        className: 'zone-popup'
      }).setHTML(`
        <div class="p-3">
          <h3 class="text-sm font-black uppercase mb-2">${zone.title}</h3>
          <div class="space-y-2 text-xs">
            <div class="flex justify-between items-center">
              <span class="font-bold">Status:</span>
              <span class="px-2 py-1 rounded text-xs font-bold ${
                zone.type === 'owned' ? 'bg-teal-100 text-teal-800' : 
                zone.type === 'available' ? 'bg-green-100 text-green-800' : 
                'bg-pink-100 text-pink-800'
              }">
                ${zone.type === 'owned' ? 'Owned by you' : 
                  zone.type === 'available' ? 'Available' : 
                  'Owned by others'}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="font-bold">Points:</span>
              <span class="font-black">${zone.points}</span>
            </div>
            ${zone.distance !== undefined ? `
            <div class="flex justify-between">
              <span class="font-bold">Distance:</span>
              <span class="font-black">${zone.distance}km</span>
            </div>
            ` : ''}
            <div class="flex justify-between">
              <span class="font-bold">Difficulty:</span>
              <span class="font-black capitalize" style="color: ${difficultyColors[zone.difficulty || 'medium']}">${zone.difficulty}</span>
            </div>
            ${zone.type === 'available' ? `
            <button class="w-full mt-2 px-3 py-2 bg-green-600 text-white font-bold text-xs border-2 border-black hover:bg-green-700 transition-colors">
              🏃 Start Run to Capture
            </button>
            ` : ''}
          </div>
        </div>
      `);

      // Add click handler to marker
      markerEl.addEventListener('click', () => {
        if (onZoneClick) {
          onZoneClick(zone);
        }
      });

      // Add marker to map
      const marker = new maplibregl.Marker(markerEl)
        .setLngLat(zone.coordinates)
        .setPopup(popup)
        .addTo(map.current!);
      
      markersRef.current.push(marker);
    });

    // Add click handler for general map interaction
    map.current.on('click', (e) => {
      console.log('Map clicked at:', e.lngLat);
    });

  }, [isMapLoaded, userLocation, onZoneClick]);

  return (
    <div 
      ref={mapContainer} 
      className={`tomtom-map ${className}`}
      style={{ width, height }}
    />
  );
}