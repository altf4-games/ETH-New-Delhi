import * as h3 from 'h3-js';

export function gpsToH3(latlngStream, resolution = 9) {
  const hits = {};
  const zones = [];
  
  if (!latlngStream || !Array.isArray(latlngStream)) {
    return [];
  }
  
  // Process each GPS coordinate
  for (const coord of latlngStream) {
    if (!Array.isArray(coord) || coord.length < 2) continue;
    
    const lat = coord[0];
    const lng = coord[1];
    
    // Skip invalid coordinates
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) continue;
    
    try {
      const h3Index = h3.geoToH3(lat, lng, resolution);
      
      if (!hits[h3Index]) {
        hits[h3Index] = {
          count: 0,
          firstHit: { lat, lng },
          bounds: null
        };
      }
      
      hits[h3Index].count++;
    } catch (error) {
      console.warn('Invalid H3 conversion:', { lat, lng, error: error.message });
      continue;
    }
  }
  
  // Convert to sorted array with additional metadata
  Object.keys(hits).forEach(h3Index => {
    try {
      const bounds = h3.h3ToGeoBoundary(h3Index, true); // formatAsGeoJson = true
      const center = h3.h3ToGeo(h3Index);
      
      zones.push({
        h3Index,
        hits: hits[h3Index].count,
        center: {
          lat: center[0],
          lng: center[1]
        },
        bounds,
        firstHit: hits[h3Index].firstHit,
        resolution,
        area: h3.hexArea(resolution, h3.UNITS.m2) // Area in square meters
      });
    } catch (error) {
      console.warn('Error processing H3 zone:', { h3Index, error: error.message });
    }
  });
  
  // Sort by hit count (most visited zones first)
  zones.sort((a, b) => b.hits - a.hits);
  
  return zones;
}

export function getNearbyZones(lat, lng, resolution = 9, k = 1) {
  try {
    const centerH3 = h3.geoToH3(lat, lng, resolution);
    const nearbyIndices = h3.kRing(centerH3, k);
    
    return nearbyIndices.map(h3Index => {
      const center = h3.h3ToGeo(h3Index);
      const bounds = h3.h3ToGeoBoundary(h3Index, true);
      
      return {
        h3Index,
        center: {
          lat: center[0],
          lng: center[1]
        },
        bounds,
        resolution,
        area: h3.hexArea(resolution, h3.UNITS.m2)
      };
    });
  } catch (error) {
    console.error('Error getting nearby zones:', error);
    return [];
  }
}

export function getZoneGeometry(h3Index) {
  try {
    const bounds = h3.h3ToGeoBoundary(h3Index, true);
    const center = h3.h3ToGeo(h3Index);
    
    // Convert to GeoJSON polygon format
    const coordinates = bounds.map(coord => [coord[1], coord[0]]); // lng, lat for GeoJSON
    coordinates.push(coordinates[0]); // Close the polygon
    
    return {
      type: 'Feature',
      properties: {
        h3Index,
        resolution: h3.h3GetResolution(h3Index),
        area: h3.hexArea(h3.h3GetResolution(h3Index), h3.UNITS.m2)
      },
      geometry: {
        type: 'Polygon',
        coordinates: [coordinates]
      }
    };
  } catch (error) {
    console.error('Error getting zone geometry:', error);
    return null;
  }
}

export function isValidH3Index(h3Index) {
  try {
    return h3.h3IsValid(h3Index);
  } catch (error) {
    return false;
  }
}

export function getH3Resolution(h3Index) {
  try {
    return h3.h3GetResolution(h3Index);
  } catch (error) {
    return null;
  }
}

export function getParentZone(h3Index, parentResolution) {
  try {
    const currentRes = h3.h3GetResolution(h3Index);
    if (parentResolution >= currentRes) {
      return h3Index; // Cannot get parent at same or higher resolution
    }
    return h3.h3ToParent(h3Index, parentResolution);
  } catch (error) {
    console.error('Error getting parent zone:', error);
    return null;
  }
}

export function getChildZones(h3Index, childResolution) {
  try {
    const currentRes = h3.h3GetResolution(h3Index);
    if (childResolution <= currentRes) {
      return [h3Index]; // Cannot get children at same or lower resolution
    }
    return h3.h3ToChildren(h3Index, childResolution);
  } catch (error) {
    console.error('Error getting child zones:', error);
    return [];
  }
}

export function calculateZoneCoverage(latlngStream, resolution = 9) {
  const zones = gpsToH3(latlngStream, resolution);
  
  if (zones.length === 0) {
    return {
      totalZones: 0,
      totalArea: 0,
      averageHits: 0,
      coverage: [],
      summary: 'No valid GPS data'
    };
  }
  
  const totalHits = zones.reduce((sum, zone) => sum + zone.hits, 0);
  const totalArea = zones.reduce((sum, zone) => sum + zone.area, 0);
  const averageHits = totalHits / zones.length;
  
  // Calculate coverage statistics
  const coverage = zones.map(zone => ({
    h3Index: zone.h3Index,
    hits: zone.hits,
    percentage: (zone.hits / totalHits) * 100,
    area: zone.area,
    center: zone.center
  }));
  
  return {
    totalZones: zones.length,
    totalHits,
    totalArea: Math.round(totalArea),
    averageHits: Math.round(averageHits * 100) / 100,
    coverage,
    summary: `Activity covered ${zones.length} H3 zones with total area of ${Math.round(totalArea)} m²`
  };
}

export function findZoneOverlaps(zones1, zones2) {
  const overlaps = [];
  const zones2Set = new Set(zones2.map(z => z.h3Index || z));
  
  for (const zone of zones1) {
    const h3Index = zone.h3Index || zone;
    if (zones2Set.has(h3Index)) {
      overlaps.push(h3Index);
    }
  }
  
  return overlaps;
}

export function getZoneDistance(h3Index1, h3Index2) {
  try {
    const center1 = h3.h3ToGeo(h3Index1);
    const center2 = h3.h3ToGeo(h3Index2);
    
    // Calculate distance using Haversine formula
    const toRad = (x) => (x * Math.PI) / 180;
    const lat1 = center1[0];
    const lon1 = center1[1];
    const lat2 = center2[0];
    const lon2 = center2[1];
    
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const rLat1 = toRad(lat1);
    const rLat2 = toRad(lat2);
    
    const sinDLat = Math.sin(dLat / 2);
    const sinDLon = Math.sin(dLon / 2);
    const a = sinDLat * sinDLat + Math.cos(rLat1) * Math.cos(rLat2) * sinDLon * sinDLon;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    const R = 6371000; // Earth's radius in meters
    return R * c;
  } catch (error) {
    console.error('Error calculating zone distance:', error);
    return null;
  }
}

export function groupZonesByRegion(zones, resolution = 7) {
  const regions = {};
  
  zones.forEach(zone => {
    try {
      const h3Index = zone.h3Index || zone;
      const parentIndex = getParentZone(h3Index, resolution);
      
      if (!regions[parentIndex]) {
        const parentCenter = h3.h3ToGeo(parentIndex);
        regions[parentIndex] = {
          regionId: parentIndex,
          center: {
            lat: parentCenter[0],
            lng: parentCenter[1]
          },
          zones: [],
          totalHits: 0,
          area: h3.hexArea(resolution, h3.UNITS.m2)
        };
      }
      
      regions[parentIndex].zones.push(zone);
      regions[parentIndex].totalHits += zone.hits || 1;
    } catch (error) {
      console.warn('Error grouping zone by region:', error);
    }
  });
  
  return Object.values(regions);
}