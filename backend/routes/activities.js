import express from 'express';
import axios from 'axios';
import { Activity, User } from '../models/index.js';
import { getH3Path } from '../utils/h3Utils.js';
import { calculateActivityPoints, calculateCaptureScore } from '../utils/pointsEngine.js';
import polyline from '@mapbox/polyline';

const router = express.Router();

// POST /api/activities/import - Import activities from Strava
router.post('/import', async (req, res) => {
  const { walletAddress, stravaToken } = req.body;
  
  if (!walletAddress || !stravaToken) {
    return res.status(400).json({ error: 'Wallet address and Strava token required' });
  }
  
  try {
    // Find or create user
    let user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
    if (!user) {
      user = new User({
        walletAddress: walletAddress.toLowerCase(),
        name: `Runner ${walletAddress.slice(-4)}`,
        stravaToken
      });
      await user.save();
    } else {
      user.stravaToken = stravaToken;
      await user.save();
    }

    // Fetch recent activities from Strava API
    const activitiesResponse = await axios.get(
      'https://www.strava.com/api/v3/athlete/activities',
      {
        headers: { 
          Authorization: `Bearer ${stravaToken}` 
        },
        params: {
          per_page: 30, // Limit to 30 most recent activities
          page: 1
        }
      }
    );

    const stravaActivities = activitiesResponse.data;
    let importedCount = 0;
    let skippedCount = 0;

    for (const stravaActivity of stravaActivities) {
      // Check if already imported
      const existingActivity = await Activity.findOne({ 
        stravaId: stravaActivity.id,
        userId: user._id 
      });
      
      if (existingActivity) {
        skippedCount++;
        continue;
      }

      // Calculate points and H3 zones from activity data
      const points = calculateActivityPoints(stravaActivity);
      let h3Zones = [];
      let polylineData = null;

      // Get detailed activity data with GPS streams if available
      try {
        if (stravaActivity.start_latlng && stravaActivity.map?.summary_polyline) {
          // Decode polyline to get GPS coordinates
          const coordinates = polyline.decode(stravaActivity.map.summary_polyline);
          h3Zones = getH3Path(coordinates, 9);
          polylineData = stravaActivity.map.summary_polyline;
        }
      } catch (polylineError) {
        console.warn('Could not process polyline for activity:', stravaActivity.id);
      }

      // Create activity record
      const activity = new Activity({
        stravaId: stravaActivity.id,
        userId: user._id,
        name: stravaActivity.name,
        type: stravaActivity.sport_type || stravaActivity.type,
        distance: stravaActivity.distance || 0,
        movingTime: stravaActivity.moving_time || 0,
        elapsedTime: stravaActivity.elapsed_time || 0,
        totalElevationGain: stravaActivity.total_elevation_gain || 0,
        startDate: new Date(stravaActivity.start_date),
        startDateLocal: new Date(stravaActivity.start_date_local),
        startLatLng: stravaActivity.start_latlng || null,
        endLatLng: stravaActivity.end_latlng || null,
        polyline: polylineData,
        points,
        h3Zones,
        averageSpeed: stravaActivity.average_speed || 0,
        maxSpeed: stravaActivity.max_speed || 0,
        averageHeartrate: stravaActivity.average_heartrate || null,
        maxHeartrate: stravaActivity.max_heartrate || null,
        averageWatts: stravaActivity.average_watts || null,
        kilojoules: stravaActivity.kilojoules || null,
        trainer: stravaActivity.trainer || false,
        commute: stravaActivity.commute || false
      });

      await activity.save();

      // Update user totals
      user.totalPoints += points;
      user.totalActivities += 1;
      await user.save();

      importedCount++;
    }

    res.json({
      success: true,
      imported: importedCount,
      skipped: skippedCount,
      total: stravaActivities.length,
      message: `Imported ${importedCount} new activities, skipped ${skippedCount} existing activities`,
      activities: stravaActivities.slice(0, 5).map(activity => ({
        id: activity.id,
        name: activity.name,
        type: activity.sport_type || activity.type,
        distance: activity.distance,
        moving_time: activity.moving_time,
        start_date: activity.start_date
      }))
    });
    
  } catch (error) {
    console.error('Activity import error:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      return res.status(401).json({ 
        error: 'Invalid or expired Strava token',
        message: 'Please re-authorize with Strava to refresh your token'
      });
    }
    
    if (error.response?.status === 429) {
      return res.status(429).json({ 
        error: 'Strava API rate limit exceeded',
        message: 'Please try again in a few minutes'
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to import activities',
      details: error.response?.data?.message || error.message
    });
  }
});

// POST /api/activities/import/:id - Import Strava activity
router.post('/import/:id', async (req, res) => {
  const activityId = req.params.id;
  const { stravaToken, userId } = req.body;
  
  if (!stravaToken) {
    return res.status(400).json({ error: 'Strava access token required' });
  }
  
  try {
    // Fetch activity from Strava
    const activityResponse = await axios.get(
      `https://www.strava.com/api/v3/activities/${activityId}`,
      {
        headers: { Authorization: `Bearer ${stravaToken}` }
      }
    );
    
    const activity = activityResponse.data;
    
    // Get GPS streams if available
    let streams = null;
    let h3Zones = [];
    let points = 0;
    
    if (activity.start_latlng) {
      try {
        const streamResponse = await axios.get(
          `https://www.strava.com/api/v3/activities/${activityId}/streams`,
          {
            params: { keys: 'latlng,altitude,time', key_by_type: true },
            headers: { Authorization: `Bearer ${stravaToken}` }
          }
        );
        streams = streamResponse.data;
        
        if (streams.latlng?.data) {
          h3Zones = gpsToH3(streams.latlng.data).map(zone => zone.h3Index);
          points = computePoints(streams);
        }
      } catch (streamError) {
        console.warn('Could not fetch streams:', streamError.message);
      }
    }
    
    // Save to database
    const newActivity = new Activity({
      stravaId: activityId,
      userId: userId || 'demo_user',
      name: activity.name,
      distance: activity.distance,
      duration: activity.moving_time,
      points,
      h3Zones,
      startDate: new Date(activity.start_date)
    });
    
    await newActivity.save();
    
    res.json({
      success: true,
      activity: {
        id: newActivity._id,
        name: newActivity.name,
        distance: newActivity.distance,
        duration: newActivity.duration,
        points: newActivity.points,
        zones: h3Zones.length,
        startDate: newActivity.startDate
      }
    });
    
  } catch (error) {
    console.error('Activity import error:', error);
    res.status(500).json({ 
      error: 'Failed to import activity',
      details: error.response?.data?.message || error.message
    });
  }
});

// GET /api/activities - Get user activities
router.get('/', async (req, res) => {
  const { userId = 'demo_user', limit = 10 } = req.query;
  
  try {
    const activities = await Activity.find({ userId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    res.json({
      activities: activities.map(activity => ({
        id: activity._id,
        name: activity.name,
        distance: activity.distance,
        duration: activity.duration,
        points: activity.points,
        zones: activity.h3Zones.length,
        startDate: activity.startDate,
        flagged: activity.flagged
      }))
    });
    
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

export default router;