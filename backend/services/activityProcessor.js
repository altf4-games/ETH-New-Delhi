import axios from 'axios';
import { computePoints } from './pointsEngine.js';
import { gpsToH3 } from './h3Utils.js';
import { runAntiCheat } from './antiCheat.js';
import { wss } from '../server.js';

export async function processActivity(eventData) {
  const { athleteId, activityId, userId, activityData, manual = false } = eventData;
  
  try {
    let streams;
    
    if (activityData) {
      // Use provided activity data (for manual imports)
      streams = activityData.streams;
    } else {
      // Fetch from Strava API
      const accessToken = await getUserAccessToken(userId);
      streams = await fetchActivityStreams(activityId, accessToken);
    }
    
    if (!streams || !streams.latlng) {
      throw new Error('No GPS data available for activity');
    }
    
    // Compute points from activity
    const pointsResult = computePoints(streams);
    
    // Convert GPS coordinates to H3 zones
    const h3Zones = gpsToH3(streams.latlng);
    
    // Run anti-cheat validation
    const antiCheatResult = runAntiCheat(streams);
    
    // If activity is flagged, handle appropriately
    if (antiCheatResult.flagged) {
      await flagActivity(athleteId, activityId, antiCheatResult);
      
      // Notify via WebSocket
      broadcastToUser(userId, {
        type: 'activity_flagged',
        activityId,
        reason: antiCheatResult.reason,
        details: antiCheatResult
      });
      
      return {
        activityId,
        status: 'flagged',
        reason: antiCheatResult.reason,
        flagDetails: antiCheatResult
      };
    }
    
    // Save processed activity
    const processedActivity = await persistActivity({
      athleteId,
      activityId,
      userId,
      streams,
      points: pointsResult,
      h3Zones,
      antiCheat: antiCheatResult,
      processedAt: new Date(),
      manual
    });
    
    // Check for zone captures
    const zoneCaptures = await checkZoneCaptures(h3Zones, pointsResult.totalPoints, userId);
    
    // Notify via WebSocket about successful processing
    broadcastToUser(userId, {
      type: 'activity_processed',
      activityId,
      points: pointsResult.totalPoints,
      zones: h3Zones.length,
      captures: zoneCaptures.length
    });
    
    // Trigger reward distribution for significant achievements
    await checkRewardTriggers(processedActivity, zoneCaptures);
    
    return {
      activityId,
      status: 'processed',
      points: pointsResult,
      zones: h3Zones,
      captures: zoneCaptures,
      processedAt: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Activity processing error:', error);
    
    // Save error state
    await persistActivity({
      athleteId,
      activityId,
      userId,
      status: 'error',
      error: error.message,
      processedAt: new Date()
    });
    
    throw error;
  }
}

async function fetchActivityStreams(activityId, accessToken) {
  try {
    const response = await axios.get(
      `https://www.strava.com/api/v3/activities/${activityId}/streams`,
      {
        params: {
          keys: 'latlng,altitude,time,heartrate,velocity_smooth',
          key_by_type: true
        },
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      throw new Error('Strava access token expired');
    }
    throw new Error(`Failed to fetch activity streams: ${error.message}`);
  }
}

async function getUserAccessToken(userId) {
  // In production, fetch from database
  // For demo, return a mock token
  return 'mock_access_token';
}

async function flagActivity(athleteId, activityId, antiCheatResult) {
  // In production, save to database
  console.log('Activity flagged:', {
    athleteId,
    activityId,
    flag: antiCheatResult
  });
}

async function persistActivity(activityData) {
  // In production, save to database
  console.log('Activity persisted:', {
    id: activityData.activityId,
    status: activityData.status || 'processed',
    points: activityData.points?.totalPoints || 0,
    zones: activityData.h3Zones?.length || 0
  });
  
  return activityData;
}

async function checkZoneCaptures(h3Zones, totalPoints, userId) {
  // Mock zone capture logic
  const captures = [];
  
  for (const zone of h3Zones.slice(0, 3)) { // Check top 3 zones
    const currentOwnership = await getZoneOwnership(zone);
    const currentPower = computeDecayedPower(currentOwnership);
    
    if (totalPoints > currentPower) {
      captures.push({
        h3Index: zone,
        previousOwner: currentOwnership?.ownerId || null,
        newOwner: userId,
        captureScore: totalPoints,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  return captures;
}

async function getZoneOwnership(h3Index) {
  // Mock ownership data
  return {
    ownerId: 'previous_owner',
    captureScore: 450,
    capturedAt: '2024-01-10T12:00:00Z'
  };
}

function computeDecayedPower(ownership) {
  if (!ownership) return 0;
  
  const now = new Date();
  const captured = new Date(ownership.capturedAt);
  const ageInDays = (now - captured) / (1000 * 60 * 60 * 24);
  const decay = Math.floor(ageInDays);
  
  return Math.max(0, ownership.captureScore - decay);
}

async function checkRewardTriggers(activity, captures) {
  // Trigger rewards for zone captures
  for (const capture of captures) {
    console.log('Zone capture reward triggered:', capture);
    // In production, queue reward distribution
  }
  
  // Check for milestone rewards
  if (activity.points?.totalPoints > 100) {
    console.log('High score bonus triggered:', activity.points.totalPoints);
  }
}

function broadcastToUser(userId, message) {
  // In production, implement proper user session tracking
  wss.clients.forEach(client => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(JSON.stringify({
        userId,
        ...message
      }));
    }
  });
}
