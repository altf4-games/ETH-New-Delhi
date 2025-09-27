export function runAntiCheat(streams) {
  const latlng = streams.latlng?.data || streams.latlng || [];
  const time = streams.time?.data || streams.time || [];
  const altitude = streams.altitude?.data || streams.altitude || [];
  const heartrate = streams.heartrate?.data || streams.heartrate || [];
  
  const results = {
    flagged: false,
    reason: null,
    confidence: 0,
    checks: {},
    metadata: {
      totalPoints: latlng.length,
      duration: time.length > 0 ? time[time.length - 1] - time[0] : 0,
      checkedAt: new Date().toISOString()
    }
  };
  
  if (latlng.length < 2) {
    return {
      flagged: true,
      reason: 'insufficient_data',
      confidence: 1.0,
      details: 'Activity has insufficient GPS data points'
    };
  }
  
  // Check 1: Impossible speeds
  const speedCheck = checkImpossibleSpeeds(latlng, time);
  results.checks.speed = speedCheck;
  if (speedCheck.flagged) {
    results.flagged = true;
    results.reason = 'impossible_speed';
    results.confidence = speedCheck.confidence;
    return results;
  }
  
  // Check 2: GPS consistency and jumps
  const gpsCheck = checkGpsConsistency(latlng, time);
  results.checks.gps = gpsCheck;
  if (gpsCheck.flagged) {
    results.flagged = true;
    results.reason = 'gps_inconsistent';
    results.confidence = gpsCheck.confidence;
    return results;
  }
  
  // Check 3: Heart rate anomalies
  const hrCheck = checkHeartRateAnomalies(heartrate, latlng, time);
  results.checks.heartRate = hrCheck;
  if (hrCheck.flagged) {
    results.flagged = true;
    results.reason = 'heart_rate_anomaly';
    results.confidence = hrCheck.confidence;
    return results;
  }
  
  // Check 4: Elevation anomalies
  const elevationCheck = checkElevationAnomalies(altitude, latlng);
  results.checks.elevation = elevationCheck;
  if (elevationCheck.flagged) {
    results.flagged = true;
    results.reason = 'elevation_anomaly';
    results.confidence = elevationCheck.confidence;
    return results;
  }
  
  // Check 5: Activity pattern recognition
  const patternCheck = checkActivityPatterns(latlng, time);
  results.checks.pattern = patternCheck;
  if (patternCheck.flagged) {
    results.flagged = true;
    results.reason = 'suspicious_pattern';
    results.confidence = patternCheck.confidence;
    return results;
  }
  
  // Calculate overall suspicion score
  const suspicionScore = calculateSuspicionScore(results.checks);
  results.suspicionScore = suspicionScore;
  
  // Flag if suspicion score is too high (even if individual checks pass)
  if (suspicionScore > 0.7) {
    results.flagged = true;
    results.reason = 'high_suspicion_score';
    results.confidence = suspicionScore;
  }
  
  return results;
}

function checkImpossibleSpeeds(latlng, time) {
  const MAX_RUNNING_SPEED = parseFloat(process.env.MAX_SPEED_MS) || 12; // m/s
  let maxSpeed = 0;
  let impossibleCount = 0;
  const speedViolations = [];
  
  for (let i = 1; i < latlng.length && i < time.length; i++) {
    const dist = haversineMeters(latlng[i - 1], latlng[i]);
    const dt = Math.max(1, time[i] - time[i - 1]);
    const speed = dist / dt;
    
    maxSpeed = Math.max(maxSpeed, speed);
    
    if (speed > MAX_RUNNING_SPEED) {
      impossibleCount++;
      speedViolations.push({
        index: i,
        speed: speed,
        threshold: MAX_RUNNING_SPEED,
        distance: dist,
        timeGap: dt
      });
    }
  }
  
  // Allow a few GPS glitches, but flag if too many
  const flagged = impossibleCount > 3 || maxSpeed > MAX_RUNNING_SPEED * 1.5;
  
  return {
    flagged,
    confidence: flagged ? Math.min(1.0, impossibleCount / 10 + (maxSpeed / MAX_RUNNING_SPEED - 1)) : 0,
    maxSpeed,
    impossibleCount,
    violations: speedViolations,
    threshold: MAX_RUNNING_SPEED
  };
}

function checkGpsConsistency(latlng, time) {
  const MAX_GPS_JUMPS = parseInt(process.env.MAX_GPS_JUMPS) || 3;
  let largeJumps = 0;
  let totalDistance = 0;
  const jumpViolations = [];
  
  for (let i = 2; i < latlng.length; i++) {
    const d1 = haversineMeters(latlng[i - 2], latlng[i - 1]);
    const d2 = haversineMeters(latlng[i - 1], latlng[i]);
    const d3 = haversineMeters(latlng[i - 2], latlng[i]);
    
    totalDistance += d1;
    
    // Check for teleportation (large jump followed by another large jump)
    if (d1 > 500 && d2 > 500) {
      largeJumps++;
      jumpViolations.push({
        index: i,
        distance1: d1,
        distance2: d2,
        directDistance: d3
      });
    }
    
    // Check for impossible triangulation
    if (d3 > 0 && d1 > 0 && d2 > 0) {
      const ratio = d3 / (d1 + d2);
      if (ratio < 0.1 && d1 > 100 && d2 > 100) {
        // Points form a very narrow triangle - suspicious
        largeJumps++;
      }
    }
  }
  
  const flagged = largeJumps > MAX_GPS_JUMPS;
  
  return {
    flagged,
    confidence: flagged ? Math.min(1.0, largeJumps / 10) : 0,
    largeJumps,
    totalDistance,
    violations: jumpViolations,
    threshold: MAX_GPS_JUMPS
  };
}

function checkHeartRateAnomalies(heartrate, latlng, time) {
  if (!heartrate || heartrate.length === 0) {
    return { flagged: false, confidence: 0, reason: 'no_heart_rate_data' };
  }
  
  let anomalies = 0;
  const violations = [];
  
  // Check for impossible heart rate values
  heartrate.forEach((hr, index) => {
    if (hr < 40 || hr > 220) {
      anomalies++;
      violations.push({
        index,
        heartRate: hr,
        reason: 'impossible_value'
      });
    }
  });
  
  // Check for heart rate vs effort consistency
  if (latlng.length > 10 && time.length > 10) {
    const speeds = [];
    for (let i = 1; i < Math.min(latlng.length, time.length); i++) {
      const dist = haversineMeters(latlng[i - 1], latlng[i]);
      const dt = Math.max(1, time[i] - time[i - 1]);
      speeds.push(dist / dt);
    }
    
    const avgSpeed = speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length;
    const avgHR = heartrate.reduce((sum, hr) => sum + hr, 0) / heartrate.length;
    
    // Very high speed with very low heart rate is suspicious
    if (avgSpeed > 4 && avgHR < 120) {
      anomalies += 5;
      violations.push({
        reason: 'speed_hr_mismatch',
        avgSpeed,
        avgHR
      });
    }
  }
  
  // Check for heart rate flatlines (same value for too long)
  let flatlineLength = 1;
  let maxFlatline = 1;
  for (let i = 1; i < heartrate.length; i++) {
    if (Math.abs(heartrate[i] - heartrate[i - 1]) <= 1) {
      flatlineLength++;
    } else {
      maxFlatline = Math.max(maxFlatline, flatlineLength);
      flatlineLength = 1;
    }
  }
  maxFlatline = Math.max(maxFlatline, flatlineLength);
  
  if (maxFlatline > 60) { // Flatline for more than 60 readings
    anomalies += 3;
    violations.push({
      reason: 'heart_rate_flatline',
      flatlineLength: maxFlatline
    });
  }
  
  const flagged = anomalies > 5;
  
  return {
    flagged,
    confidence: flagged ? Math.min(1.0, anomalies / 20) : 0,
    anomalies,
    violations,
    maxFlatline
  };
}

function checkElevationAnomalies(altitude, latlng) {
  if (!altitude || altitude.length === 0) {
    return { flagged: false, confidence: 0, reason: 'no_elevation_data' };
  }
  
  let anomalies = 0;
  const violations = [];
  
  // Check for impossible elevation changes
  for (let i = 1; i < altitude.length; i++) {
    const elevChange = Math.abs(altitude[i] - altitude[i - 1]);
    
    // More than 100m elevation change between consecutive points is suspicious
    if (elevChange > 100) {
      anomalies++;
      violations.push({
        index: i,
        elevationChange: elevChange,
        from: altitude[i - 1],
        to: altitude[i]
      });
    }
  }
  
  // Check for elevation vs GPS distance consistency
  if (latlng.length === altitude.length) {
    for (let i = 1; i < altitude.length; i++) {
      const horizontalDist = haversineMeters(latlng[i - 1], latlng[i]);
      const elevChange = Math.abs(altitude[i] - altitude[i - 1]);
      
      // Impossible grade (> 100% for running)
      if (horizontalDist > 0) {
        const grade = elevChange / horizontalDist;
        if (grade > 1.0 && horizontalDist > 10) {
          anomalies++;
          violations.push({
            index: i,
            grade: grade * 100,
            horizontalDistance: horizontalDist,
            elevationChange: elevChange
          });
        }
      }
    }
  }
  
  const flagged = anomalies > 5;
  
  return {
    flagged,
    confidence: flagged ? Math.min(1.0, anomalies / 15) : 0,
    anomalies,
    violations
  };
}

function checkActivityPatterns(latlng, time) {
  let suspicionCount = 0;
  const patterns = [];
  
  // Check for perfect circles (suspicious for running)
  const circleCheck = detectCircularPatterns(latlng);
  if (circleCheck.suspicious) {
    suspicionCount += circleCheck.score;
    patterns.push(circleCheck);
  }
  
  // Check for repeated exact GPS coordinates
  const duplicateCheck = detectDuplicateCoordinates(latlng);
  if (duplicateCheck.suspicious) {
    suspicionCount += duplicateCheck.score;
    patterns.push(duplicateCheck);
  }
  
  // Check for unnatural regularity in timing
  const timingCheck = detectUnaturalTiming(time);
  if (timingCheck.suspicious) {
    suspicionCount += timingCheck.score;
    patterns.push(timingCheck);
  }
  
  const flagged = suspicionCount > 10;
  
  return {
    flagged,
    confidence: flagged ? Math.min(1.0, suspicionCount / 20) : 0,
    suspicionCount,
    patterns
  };
}

function detectCircularPatterns(latlng) {
  // Simple check for activities that are too perfectly circular
  if (latlng.length < 10) return { suspicious: false, score: 0 };
  
  const start = latlng[0];
  const end = latlng[latlng.length - 1];
  const totalDistance = latlng.reduce((sum, point, index) => {
    if (index === 0) return 0;
    return sum + haversineMeters(latlng[index - 1], point);
  }, 0);
  
  const directDistance = haversineMeters(start, end);
  const circularityRatio = directDistance / totalDistance;
  
  // Very circular activities (ratio < 0.1) can be suspicious if they're too perfect
  if (circularityRatio < 0.1 && totalDistance > 1000) {
    // Check if points are too evenly distributed
    const angles = [];
    const center = [
      latlng.reduce((sum, p) => sum + p[0], 0) / latlng.length,
      latlng.reduce((sum, p) => sum + p[1], 0) / latlng.length
    ];
    
    latlng.forEach(point => {
      const angle = Math.atan2(point[1] - center[1], point[0] - center[0]);
      angles.push(angle);
    });
    
    // Check for too-even angular distribution
    const angleVariance = calculateVariance(angles);
    if (angleVariance < 0.5) {
      return { suspicious: true, score: 5, pattern: 'perfect_circle' };
    }
  }
  
  return { suspicious: false, score: 0 };
}

function detectDuplicateCoordinates(latlng) {
  const coordMap = new Map();
  let duplicates = 0;
  
  latlng.forEach(coord => {
    const key = `${coord[0].toFixed(6)},${coord[1].toFixed(6)}`;
    if (coordMap.has(key)) {
      duplicates++;
    } else {
      coordMap.set(key, 1);
    }
  });
  
  const duplicateRatio = duplicates / latlng.length;
  
  if (duplicateRatio > 0.3) {
    return { suspicious: true, score: 8, pattern: 'duplicate_coordinates', ratio: duplicateRatio };
  }
  
  return { suspicious: false, score: 0 };
}

function detectUnaturalTiming(time) {
  if (time.length < 10) return { suspicious: false, score: 0 };
  
  const intervals = [];
  for (let i = 1; i < time.length; i++) {
    intervals.push(time[i] - time[i - 1]);
  }
  
  // Check for suspiciously regular intervals
  const intervalVariance = calculateVariance(intervals);
  const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
  
  // Very low variance in timing can indicate artificial data
  if (intervalVariance < 0.1 && avgInterval > 5) {
    return { suspicious: true, score: 6, pattern: 'regular_timing', variance: intervalVariance };
  }
  
  return { suspicious: false, score: 0 };
}

function calculateSuspicionScore(checks) {
  let score = 0;
  
  if (checks.speed && !checks.speed.flagged) {
    score += checks.speed.confidence * 0.3;
  }
  
  if (checks.gps && !checks.gps.flagged) {
    score += checks.gps.confidence * 0.2;
  }
  
  if (checks.heartRate && !checks.heartRate.flagged) {
    score += checks.heartRate.confidence * 0.2;
  }
  
  if (checks.elevation && !checks.elevation.flagged) {
    score += checks.elevation.confidence * 0.1;
  }
  
  if (checks.pattern && !checks.pattern.flagged) {
    score += checks.pattern.confidence * 0.2;
  }
}