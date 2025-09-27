import h3 from 'h3-js';

// Convert lat/lng to H3 index
export function latLngToH3(lat, lng, resolution = 9) {
  return h3.latLngToCell(lat, lng, resolution);
}

// Check if H3 index is valid
export function isValidH3Index(h3Index) {
  return h3.isValidCell(h3Index);
}

// Get zone neighbors
export function getZoneNeighbors(h3Index) {
  return h3.gridDisk(h3Index, 1);
}

// Convert H3 index to lat/lng
export function h3ToLatLng(h3Index) {
  return h3.cellToLatLng(h3Index);
}

// Get H3 cells along a path for activity tracking
export function getH3Path(coordinates, resolution = 9) {
  if (!coordinates || coordinates.length < 2) return [];
  
  const h3Cells = new Set();
  
  for (const coord of coordinates) {
    if (coord.length >= 2) {
      h3Cells.add(latLngToH3(coord[1], coord[0], resolution));
    }
  }
  
  return Array.from(h3Cells);
}