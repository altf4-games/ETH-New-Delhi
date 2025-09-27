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
  polygon?: [number, number][]; // For colored zones
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

  // Sample zone data - Delhi areas with colored polygons
  const zones: ZoneMarker[] = [
    {
      id: '1',
      coordinates: [77.2090, 28.6139],
      type: 'owned',
      title: 'Connaught Place Zone',
      points: 500,
      distance: 0,
      difficulty: 'medium',
      polygon: [
        [77.2050, 28.6180],
        [77.2130, 28.6180], 
        [77.2130, 28.6100],
        [77.2050, 28.6100],
        [77.2050, 28.6180]
      ]
    },
    {
      id: '2',
      coordinates: [77.2300, 28.6280],
      type: 'available',
      title: 'India Gate Zone',
      points: 750,
      distance: 2.3,
      difficulty: 'easy',
      polygon: [
        [77.2250, 28.6320],
        [77.2350, 28.6320],
        [77.2350, 28.6240],
        [77.2250, 28.6240],
        [77.2250, 28.6320]
      ]
    },
    {
      id: '3',
      coordinates: [77.1910, 28.5355],
      type: 'others',
      title: 'Hauz Khas Zone',
      points: 650,
      distance: 8.5,
      difficulty: 'hard',
      polygon: [
        [77.1870, 28.5400],
        [77.1950, 28.5400],
        [77.1950, 28.5310],
        [77.1870, 28.5310],
        [77.1870, 28.5400]
      ]
    },
    {
      id: '4',
      coordinates: [77.2500, 28.6500],
      type: 'available',
      title: 'Red Fort Zone',
      points: 800,
      distance: 4.2,
      difficulty: 'medium',
      polygon: [
        [77.2450, 28.6550],
        [77.2550, 28.6550],
        [77.2550, 28.6450],
        [77.2450, 28.6450],
        [77.2450, 28.6550]
      ]
    },
    {
      id: '5',
      coordinates: [77.1800, 28.6100],
      type: 'owned',
      title: 'Karol Bagh Zone',
      points: 450,
      distance: 0,
      difficulty: 'easy',
      polygon: [
        [77.1750, 28.6150],
        [77.1850, 28.6150],
        [77.1850, 28.6050],
        [77.1750, 28.6050],
        [77.1750, 28.6150]
      ]
    },
    {
      id: '6',
      coordinates: [77.2200, 28.6000],
      type: 'available',
      title: 'Lodhi Gardens Zone',
      points: 900,
      distance: 3.1,
      difficulty: 'hard',
      polygon: [
        [77.2150, 28.6050],
        [77.2250, 28.6050],
        [77.2250, 28.5950],
        [77.2150, 28.5950],
        [77.2150, 28.6050]
      ]
    },
    {
      id: '7',
      coordinates: [77.2167, 28.6358],
      type: 'available',
      title: 'Rajpath Zone',
      points: 1000,
      distance: 3.8,
      difficulty: 'medium',
      polygon: [
        [77.2120, 28.6400],
        [77.2214, 28.6400],
        [77.2214, 28.6316],
        [77.2120, 28.6316],
        [77.2120, 28.6400]
      ]
    },
    {
      id: '8',
      coordinates: [77.2700, 28.6100],
      type: 'others',
      title: 'Mayur Vihar Zone',
      points: 550,
      distance: 6.7,
      difficulty: 'medium',
      polygon: [
        [77.2650, 28.6150],
        [77.2750, 28.6150],
        [77.2750, 28.6050],
        [77.2650, 28.6050],
        [77.2650, 28.6150]
      ]
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
      
      // Add zone polygons as colored areas
      zones.forEach((zone) => {
        if (zone.polygon) {
          // Add data source for this zone
          map.current!.addSource(`zone-${zone.id}`, {
            type: 'geojson',
            data: {
              type: 'Feature',
              geometry: {
                type: 'Polygon',
                coordinates: [zone.polygon]
              },
              properties: {
                zoneId: zone.id,
                title: zone.title,
                type: zone.type
              }
            }
          });

          // Set colors based on zone type
          const fillColor = zone.type === 'owned' ? '#0ea5a4' : 
                          zone.type === 'available' ? '#10b981' : '#ec4899';
          const strokeColor = '#000000';

          // Add fill layer
          map.current!.addLayer({
            id: `zone-fill-${zone.id}`,
            type: 'fill',
            source: `zone-${zone.id}`,
            paint: {
              'fill-color': fillColor,
              'fill-opacity': 0.4
            }
          });

          // Add border layer
          map.current!.addLayer({
            id: `zone-border-${zone.id}`,
            type: 'line',
            source: `zone-${zone.id}`,
            paint: {
              'line-color': strokeColor,
              'line-width': 3
            }
          });

          // Add click event for zone
          map.current!.on('click', `zone-fill-${zone.id}`, (e) => {
            if (onZoneClick) {
              onZoneClick(zone);
            }
            
            // Show popup
            new maplibregl.Popup()
              .setLngLat(e.lngLat)
              .setHTML(`
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
                        ${zone.type === 'owned' ? '👑 Owned by you' : 
                          zone.type === 'available' ? '🎯 Available' : 
                          '🔒 Owned by others'}
                      </span>
                    </div>
                    <div class="flex justify-between">
                      <span class="font-bold">Reward Points:</span>
                      <span class="font-black text-yellow-600">⭐ ${zone.points}</span>
                    </div>
                    ${zone.distance !== undefined && zone.distance > 0 ? `
                    <div class="flex justify-between">
                      <span class="font-bold">Distance:</span>
                      <span class="font-black">📍 ${zone.distance}km away</span>
                    </div>
                    ` : zone.distance === 0 ? `
                    <div class="flex justify-between">
                      <span class="font-bold">Distance:</span>
                      <span class="font-black text-green-600">📍 Current Location</span>
                    </div>
                    ` : ''}
                    <div class="flex justify-between">
                      <span class="font-bold">Difficulty:</span>
                      <span class="font-black capitalize">
                        ${zone.difficulty === 'easy' ? '🟢' : zone.difficulty === 'hard' ? '🔴' : '🟡'} ${zone.difficulty}
                      </span>
                    </div>
                    ${zone.type === 'available' ? `
                    <button class="w-full mt-3 px-3 py-2 bg-green-600 text-white font-bold text-xs border-2 border-black hover:bg-green-700 transition-colors rounded-sm">
                      🏃‍♂️ Start Run to Capture Zone
                    </button>
                    ` : zone.type === 'owned' ? `
                    <button class="w-full mt-3 px-3 py-2 bg-teal-600 text-white font-bold text-xs border-2 border-black hover:bg-teal-700 transition-colors rounded-sm">
                      👑 View Zone Details
                    </button>
                    ` : `
                    <div class="mt-3 px-3 py-2 bg-gray-200 text-gray-600 font-bold text-xs border-2 border-black rounded-sm text-center">
                      🔒 Challenge owner to compete
                    </div>
                    `}
                  </div>
                </div>
              `)
              .addTo(map.current!);
          });

          // Change cursor on hover
          map.current!.on('mouseenter', `zone-fill-${zone.id}`, () => {
            map.current!.getCanvas().style.cursor = 'pointer';
          });

          map.current!.on('mouseleave', `zone-fill-${zone.id}`, () => {
            map.current!.getCanvas().style.cursor = '';
          });
        }
      });
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

    // Add center markers for zones (small markers to show zone centers)
    zones.forEach((zone) => {
      const markerEl = document.createElement('div');
      markerEl.className = 'zone-center-marker';
      markerEl.style.width = '12px';
      markerEl.style.height = '12px';
      markerEl.style.borderRadius = '50%';
      markerEl.style.border = '2px solid #000';
      markerEl.style.cursor = 'pointer';
      markerEl.style.zIndex = '1000';
      
      // Set color based on zone type
      switch (zone.type) {
        case 'owned':
          markerEl.style.backgroundColor = '#0ea5a4';
          break;
        case 'available':
          markerEl.style.backgroundColor = '#10b981';
          break;
        case 'others':
          markerEl.style.backgroundColor = '#ec4899';
          break;
      }

      const marker = new maplibregl.Marker(markerEl)
        .setLngLat(zone.coordinates)
        .addTo(map.current!);
      
      markersRef.current.push(marker);
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