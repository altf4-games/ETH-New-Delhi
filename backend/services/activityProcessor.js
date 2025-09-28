import axios from 'axios';
import { computePoints } from './pointsEngine.js';
import { gpsToH3 } from './h3Utils.js';
import { runAntiCheat } from './antiCheat.js';
import { mintNFTForRun } from './nftService.js';
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
    
    // Mint NFT for completed run (if it meets criteria)
    try {
      await mintNFTForCompletedRun(processedActivity, pointsResult, h3Zones);
    } catch (nftError) {
      console.error('NFT minting failed, but activity processed successfully:', nftError);
      // Don't fail the entire process if NFT minting fails
    }
    
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

// NFT minting function for completed runs
async function mintNFTForCompletedRun(processedActivity, pointsResult, h3Zones) {
  try {
    // Check if run meets NFT minting criteria
    const meetsNFTCriteria = checkNFTMintingCriteria(processedActivity, pointsResult);
    
    if (!meetsNFTCriteria.shouldMint) {
      console.log('Run does not meet NFT minting criteria:', meetsNFTCriteria.reason);
      return null;
    }
    
    // Calculate run statistics
    const runStats = calculateRunStatistics(processedActivity);
    
    // Determine the primary zone for the run
    const primaryZone = determinePrimaryZone(h3Zones);
    
    // Get user wallet address (in production, fetch from user profile)
    const walletAddress = await getUserWalletAddress(processedActivity.userId);
    
    if (!walletAddress) {
      console.log('User wallet address not found, skipping NFT mint');
      return null;
    }
    
    // Mint NFT
    const nftResult = await mintNFTForRun({
      runner: walletAddress,
      distance: runStats.distance,
      duration: runStats.duration,
      zoneName: primaryZone.name,
      zoneCoordinates: primaryZone.coordinates,
      pointsEarned: pointsResult.totalPoints,
      timestamp: processedActivity.processedAt
    });
    
    if (nftResult.success) {
      console.log('NFT minted successfully:', nftResult.tokenId);
      
      // Notify user via WebSocket
      broadcastToUser(processedActivity.userId, {
        type: 'nft_minted',
        activityId: processedActivity.activityId,
        tokenId: nftResult.tokenId,
        runStats,
        points: pointsResult.totalPoints
      });
    }
    
    return nftResult;
  } catch (error) {
    console.error('Error minting NFT for run:', error);
    throw error;
  }
}

function checkNFTMintingCriteria(processedActivity, pointsResult) {
  // Criteria for NFT minting
  const minDistance = 1000; // 1km minimum
  const minPoints = 10; // minimum points
  
  const runStats = calculateRunStatistics(processedActivity);
  
  if (runStats.distance < minDistance) {
    return { shouldMint: false, reason: `Distance ${runStats.distance}m is less than required ${minDistance}m` };
  }
  
  if (pointsResult.totalPoints < minPoints) {
    return { shouldMint: false, reason: `Points ${pointsResult.totalPoints} is less than required ${minPoints}` };
  }
  
  return { shouldMint: true, reason: 'All criteria met' };
}

function calculateRunStatistics(processedActivity) {
  // Extract basic run statistics from streams
  const { streams } = processedActivity;
  
  if (!streams || !streams.latlng || !streams.time) {
    return {
      distance: 0,
      duration: 0,
      averageSpeed: 0
    };
  }
  
  // Calculate distance (simplified - in production use proper GPS distance calculation)
  const distance = streams.latlng.length * 50; // Rough approximation: 50m per GPS point
  
  // Calculate duration
  const timeData = streams.time?.data || [];
  const duration = timeData.length > 0 ? timeData[timeData.length - 1] - timeData[0] : 0;
  
  // Calculate average speed
  const averageSpeed = duration > 0 ? distance / duration : 0;
  
  return {
    distance,
    duration,
    averageSpeed
  };
}

function determinePrimaryZone(h3Zones) {
  // For now, return a default zone
  // In production, this would analyze the h3Zones to find the most significant zone
  return {
    name: h3Zones.length > 0 ? `Zone ${h3Zones[0].slice(0, 8)}` : 'Fitness Zone',
    coordinates: '28.6139,77.2090' // Default to Delhi coordinates
  };
}

async function getUserWalletAddress(userId) {
  // In production, fetch from user profile database
  // For demo purposes, return null to skip NFT minting
  return null;
}
