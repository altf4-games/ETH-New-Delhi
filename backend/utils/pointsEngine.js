// Simple points calculation based on activity data
export function calculateActivityPoints(activity) {
  if (!activity) return 0;
  
  let basePoints = 0;
  
  // Distance-based points (1 point per km)
  if (activity.distance) {
    basePoints += Math.floor(activity.distance / 1000);
  }
  
  // Time-based bonus (1 point per 10 minutes)
  if (activity.moving_time) {
    basePoints += Math.floor(activity.moving_time / 600);
  }
  
  // Activity type multiplier
  const typeMultipliers = {
    'Run': 1.5,
    'Ride': 1.0,
    'Walk': 0.8,
    'Hike': 1.2
  };
  
  const multiplier = typeMultipliers[activity.type] || 1.0;
  
  return Math.floor(basePoints * multiplier);
}

// Calculate zone capture power based on activity performance
export function calculateCaptureScore(activity) {
  if (!activity) return 0;
  
  let score = calculateActivityPoints(activity);
  
  // Bonus for speed (pace-based)
  if (activity.distance && activity.moving_time) {
    const speed = activity.distance / activity.moving_time; // m/s
    if (speed > 3) { // Running pace bonus
      score += Math.floor(speed * 2);
    }
  }
  
  // Minimum score to capture zones
  return Math.max(score, 10);
}