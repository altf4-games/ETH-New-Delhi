export function computePoints(streams, metadata = {}) {
  const latlng = streams.latlng?.data || streams.latlng || [];
  const altitude = streams.altitude?.data || streams.altitude || [];
  const time = streams.time?.data || streams.time || [];
  const heartrate = streams.heartrate?.data || streams.heartrate || [];
  
  if (latlng.length === 0) {
    throw new Error('No GPS data available for points calculation');
  }
  
  // Calculate distance
  let totalMeters = 0;
  for (let i = 1; i < latlng.length; i++) {
    const a = latlng[i - 1];
    const b = latlng[i];
    const dist = haversineMeters(a, b);
    totalMeters += dist;
  }
  
  const distanceKm = totalMeters / 1000;
  const durationSec = time.length > 0 ? time[time.length - 1] - time[0] : metadata.duration || 0;
  const elevationGain = computeElevationGain(altitude);
  
  // Base points calculation
  const basePoints = {
    distance: Math.floor(distanceKm) * 10, // 10 points per km
    duration: Math.floor(durationSec / 300) * 2, // 2 points per 5 minutes
    elevation: Math.floor(elevationGain / 10) * 3 // 3 points per 10m elevation
  };
  
  const totalBasePoints = basePoints.distance + basePoints.duration + basePoints.elevation;
  
  // Bonus calculations
  const bonuses = {
    pace: calculatePaceBonus(distanceKm, durationSec),
    heartRate: calculateHeartRateBonus(heartrate, durationSec),
    consistency: calculateConsistencyBonus(latlng, time),
    elevation: calculateElevationBonus(altitude, distanceKm)
  };
  
  const totalBonuses = Object.values(bonuses).reduce((sum, bonus) => sum + bonus, 0);
  
  // Penalty calculations (negative points)
  const penalties = {
    gpsGaps: calculateGpsGapPenalty(latlng, time),
    speedAnomalies: calculateSpeedAnomalyPenalty(latlng, time)
  };
  
  const totalPenalties = Object.values(penalties).reduce((sum, penalty) => sum + penalty, 0);
  
  const finalScore = Math.max(0, totalBasePoints + totalBonuses - totalPenalties);
  
  return {
    distanceKm: parseFloat(distanceKm.toFixed(2)),
    durationSec,
    elevationGain: Math.round(elevationGain),
    basePoints: totalBasePoints,
    bonuses,
    penalties,
    totalBonuses,
    totalPenalties,
    totalPoints: Math.round(finalScore),
    breakdown: {
      distance: `${Math.floor(distanceKm)} km × 10 = ${basePoints.distance} points`,
      duration: `${Math.floor(durationSec / 300)} × 5min × 2 = ${basePoints.duration} points`,
      elevation: `${Math.floor(elevationGain / 10)} × 10m × 3 = ${basePoints.elevation} points`
    },
    metadata: {
      averagePace: durationSec > 0 ? (durationSec / 60) / distanceKm : 0, // min/km
      averageSpeed: durationSec > 0 ? (distanceKm * 1000) / durationSec : 0, // m/s
      calculatedAt: new Date().toISOString()
    }
  };
}

function haversineMeters(a, b) {
  const toRad = (x) => (x * Math.PI) / 180;
  const lat1 = a[0];
  const lon1 = a[1];
  const lat2 = b[0];
  const lon2 = b[1];
  
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const rLat1 = toRad(lat1);
  const rLat2 = toRad(lat2);
  
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const aVal = sinDLat * sinDLat + Math.cos(rLat1) * Math.cos(rLat2) * sinDLon * sinDLon;
  const c = 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));
  
  const R = 6371000; // Earth's radius in meters
  return R * c;
}

function computeElevationGain(altitudeData) {
  if (!altitudeData || altitudeData.length === 0) return 0;
  
  let gain = 0;
  const smoothed = smoothElevation(altitudeData);
  
  for (let i = 1; i < smoothed.length; i++) {
    const diff = smoothed[i] - smoothed[i - 1];
    if (diff > 0.5) { // Only count gains > 0.5m to reduce GPS noise
      gain += diff;
    }
  }
  
  return gain;
}

function smoothElevation(altitudeData) {
  if (altitudeData.length < 3) return altitudeData;
  
  const smoothed = [altitudeData[0]];
  
  for (let i = 1; i < altitudeData.length - 1; i++) {
    const avg = (altitudeData[i - 1] + altitudeData[i] + altitudeData[i + 1]) / 3;
    smoothed.push(avg);
  }
  
  smoothed.push(altitudeData[altitudeData.length - 1]);
  return smoothed;
}

function calculatePaceBonus(distanceKm, durationSec) {
  if (distanceKm === 0 || durationSec === 0) return 0;
  
  const avgPaceMinPerKm = (durationSec / 60) / distanceKm;
  
  // Pace bonus tiers
  if (avgPaceMinPerKm < 4) return 50; // Sub-4min/km - elite pace
  if (avgPaceMinPerKm < 4.5) return 30; // Sub-4:30/km - very fast
  if (avgPaceMinPerKm < 5) return 20; // Sub-5min/km - fast
  if (avgPaceMinPerKm < 5.5) return 10; // Sub-5:30/km - good
  if (avgPaceMinPerKm < 6) return 5; // Sub-6min/km - decent
  
  return 0;
}

function calculateHeartRateBonus(heartrateData, durationSec) {
  if (!heartrateData || heartrateData.length === 0 || durationSec === 0) return 0;
  
  const avgHR = heartrateData.reduce((sum, hr) => sum + hr, 0) / heartrateData.length;
  const maxHR = Math.max(...heartrateData);
  
  // Estimate zones based on typical percentages
  const zone2Threshold = 0.7 * maxHR; // Aerobic base
  const zone3Threshold = 0.8 * maxHR; // Aerobic threshold
  const zone4Threshold = 0.9 * maxHR; // Lactate threshold
  
  let timeInZones = { zone1: 0, zone2: 0, zone3: 0, zone4: 0, zone5: 0 };
  
  heartrateData.forEach(hr => {
    if (hr < zone2Threshold) timeInZones.zone1++;
    else if (hr < zone3Threshold) timeInZones.zone2++;
    else if (hr < zone4Threshold) timeInZones.zone3++;
    else if (hr < maxHR * 0.95) timeInZones.zone4++;
    else timeInZones.zone5++;
  });
  
  // Bonus for sustained effort in higher zones
  const timeInterval = durationSec / heartrateData.length;
  const zone3Time = (timeInZones.zone3 * timeInterval) / 60; // minutes
  const zone4Time = (timeInZones.zone4 * timeInterval) / 60;
  const zone5Time = (timeInZones.zone5 * timeInterval) / 60;
  
  return Math.round(zone3Time * 0.5 + zone4Time * 1.0 + zone5Time * 1.5);
}

function calculateConsistencyBonus(latlngData, timeData) {
  if (latlngData.length < 10 || timeData.length < 10) return 0;
  
  const speeds = [];
  for (let i = 1; i < latlngData.length && i < timeData.length; i++) {
    const dist = haversineMeters(latlngData[i - 1], latlngData[i]);
    const dt = Math.max(1, timeData[i] - timeData[i - 1]);
    speeds.push(dist / dt);
  }
  
  if (speeds.length === 0) return 0;
  
  const avgSpeed = speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length;
  const variance = speeds.reduce((sum, speed) => sum + Math.pow(speed - avgSpeed, 2), 0) / speeds.length;
  const stdDev = Math.sqrt(variance);
  
  // Lower standard deviation = more consistent = higher bonus
  const consistencyRatio = avgSpeed / Math.max(stdDev, 0.1);
  
  return Math.min(20, Math.round(consistencyRatio * 2));
}

function calculateElevationBonus(altitudeData, distanceKm) {
  if (!altitudeData || altitudeData.length === 0 || distanceKm === 0) return 0;
  
  const elevationGain = computeElevationGain(altitudeData);
  const elevationRatio = elevationGain / (distanceKm * 1000); // gain per meter of distance
  
  // Bonus for hilly terrain
  if (elevationRatio > 0.05) return 25; // Very hilly (>5% average grade)
  if (elevationRatio > 0.03) return 15; // Hilly (>3% average grade)
  if (elevationRatio > 0.02) return 10; // Moderately hilly (>2% average grade)
  if (elevationRatio > 0.01) return 5; // Slightly hilly (>1% average grade)
  
  return 0;
}

function calculateGpsGapPenalty(latlngData, timeData) {
  if (latlngData.length < 2 || timeData.length < 2) return 0;
  
  let gapPenalty = 0;
  
  for (let i = 1; i < Math.min(latlngData.length, timeData.length); i++) {
    const timeDiff = timeData[i] - timeData[i - 1];
    
    // Penalize gaps longer than 30 seconds
    if (timeDiff > 30) {
      gapPenalty += Math.min(10, Math.floor(timeDiff / 30)); // Max 10 points penalty per gap
    }
  }
  
  return gapPenalty;
}

function calculateSpeedAnomalyPenalty(latlngData, timeData) {
  if (latlngData.length < 3 || timeData.length < 3) return 0;
  
  let anomalyPenalty = 0;
  
  for (let i = 1; i < Math.min(latlngData.length, timeData.length); i++) {
    const dist = haversineMeters(latlngData[i - 1], latlngData[i]);
    const dt = Math.max(1, timeData[i] - timeData[i - 1]);
    const speed = dist / dt; // m/s
    
    // Penalize impossible speeds for running (>15 m/s = 54 km/h)
    if (speed > 15) {
      anomalyPenalty += 5;
    }
  }
  
  return Math.min(50, anomalyPenalty); // Cap at 50 points penalty
}