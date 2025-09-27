import axios from 'axios';

export async function importStravaActivity(activityId, accessToken) {
  try {
    // Fetch basic activity data
    const activityResponse = await axios.get(
      `https://www.strava.com/api/v3/activities/${activityId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    
    const activity = activityResponse.data;
    
    // Fetch detailed streams if activity has GPS data
    let streams = null;
    if (activity.start_latlng) {
      try {
        const streamResponse = await axios.get(
          `https://www.strava.com/api/v3/activities/${activityId}/streams`,
          {
            params: {
              keys: 'latlng,altitude,time,heartrate,velocity_smooth,distance,cadence',
              key_by_type: true
            },
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }
        );
        streams = streamResponse.data;
      } catch (streamError) {
        console.warn(`Could not fetch streams for activity ${activityId}:`, streamError.message);
      }
    }
    
    // Fetch activity photos if available
    let photos = [];
    try {
      const photoResponse = await axios.get(
        `https://www.strava.com/api/v3/activities/${activityId}/photos`,
        {
          params: { photo_sources: true },
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );
      photos = photoResponse.data;
    } catch (photoError) {
      console.warn(`Could not fetch photos for activity ${activityId}:`, photoError.message);
    }
    
    return {
      id: activity.id,
      name: activity.name,
      description: activity.description,
      type: activity.type,
      sport_type: activity.sport_type,
      start_date: activity.start_date,
      start_date_local: activity.start_date_local,
      distance: activity.distance, // meters
      moving_time: activity.moving_time, // seconds
      elapsed_time: activity.elapsed_time, // seconds
      total_elevation_gain: activity.total_elevation_gain, // meters
      average_speed: activity.average_speed, // m/s
      max_speed: activity.max_speed, // m/s
      average_heartrate: activity.average_heartrate,
      max_heartrate: activity.max_heartrate,
      start_latlng: activity.start_latlng,
      end_latlng: activity.end_latlng,
      achievement_count: activity.achievement_count,
      kudos_count: activity.kudos_count,
      comment_count: activity.comment_count,
      athlete_count: activity.athlete_count,
      photo_count: activity.photo_count,
      visibility: activity.visibility,
      flagged: activity.flagged,
      gear_id: activity.gear_id,
      average_watts: activity.average_watts,
      kilojoules: activity.kilojoules,
      device_watts: activity.device_watts,
      has_heartrate: activity.has_heartrate,
      pr_count: activity.pr_count,
      suffer_score: activity.suffer_score,
      streams,
      photos,
      imported_at: new Date().toISOString()
    };
    
  } catch (error) {
    if (error.response?.status === 401) {
      throw new Error('Strava access token expired or invalid');
    }
    
    if (error.response?.status === 404) {
      throw new Error('Activity not found or not accessible');
    }
    
    if (error.response?.status === 429) {
      throw new Error('Strava API rate limit exceeded');
    }
    
    throw new Error(`Failed to import Strava activity: ${error.message}`);
  }
}

export async function fetchAthleteActivities(accessToken, options = {}) {
  try {
    const params = {
      per_page: options.limit || 30,
      page: options.page || 1
    };
    
    if (options.before) {
      params.before = Math.floor(new Date(options.before).getTime() / 1000);
    }
    
    if (options.after) {
      params.after = Math.floor(new Date(options.after).getTime() / 1000);
    }
    
    const response = await axios.get(
      'https://www.strava.com/api/v3/athlete/activities',
      {
        params,
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    
    return response.data.map(activity => ({
      id: activity.id,
      name: activity.name,
      type: activity.type,
      distance: activity.distance,
      moving_time: activity.moving_time,
      elapsed_time: activity.elapsed_time,
      total_elevation_gain: activity.total_elevation_gain,
      start_date: activity.start_date,
      start_date_local: activity.start_date_local,
      achievement_count: activity.achievement_count,
      kudos_count: activity.kudos_count,
      average_speed: activity.average_speed,
      max_speed: activity.max_speed,
      has_heartrate: activity.has_heartrate,
      pr_count: activity.pr_count
    }));
    
  } catch (error) {
    if (error.response?.status === 401) {
      throw new Error('Strava access token expired');
    }
    
    throw new Error(`Failed to fetch athlete activities: ${error.message}`);
  }
}

export async function fetchAthleteProfile(accessToken) {
  try {
    const response = await axios.get(
      'https://www.strava.com/api/v3/athlete',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    
    const athlete = response.data;
    
    return {
      id: athlete.id,
      username: athlete.username,
      resource_state: athlete.resource_state,
      firstname: athlete.firstname,
      lastname: athlete.lastname,
      bio: athlete.bio,
      city: athlete.city,
      state: athlete.state,
      country: athlete.country,
      sex: athlete.sex,
      premium: athlete.premium,
      summit: athlete.summit,
      created_at: athlete.created_at,
      updated_at: athlete.updated_at,
      badge_type_id: athlete.badge_type_id,
      weight: athlete.weight,
      profile_medium: athlete.profile_medium,
      profile: athlete.profile,
      friend: athlete.friend,
      follower: athlete.follower,
      follower_count: athlete.follower_count,
      friend_count: athlete.friend_count,
      mutual_friend_count: athlete.mutual_friend_count,
      athlete_type: athlete.athlete_type,
      date_preference: athlete.date_preference,
      measurement_preference: athlete.measurement_preference,
      clubs: athlete.clubs,
      ftp: athlete.ftp,
      bikes: athlete.bikes,
      shoes: athlete.shoes
    };
    
  } catch (error) {
    if (error.response?.status === 401) {
      throw new Error('Strava access token expired');
    }
    
    throw new Error(`Failed to fetch athlete profile: ${error.message}`);
  }
}

export async function subscribeToWebhook(callbackUrl, verifyToken) {
  try {
    const response = await axios.post(
      'https://www.strava.com/api/v3/push_subscriptions',
      {
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        callback_url: callbackUrl,
        verify_token: verifyToken
      }
    );
    
    return response.data;
    
  } catch (error) {
    throw new Error(`Failed to subscribe to Strava webhook: ${error.message}`);
  }
}

export async function refreshAccessToken(refreshToken) {
  try {
    const response = await axios.post('https://www.strava.com/oauth/token', {
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    });
    
    return {
      access_token: response.data.access_token,
      refresh_token: response.data.refresh_token,
      expires_at: response.data.expires_at,
      expires_in: response.data.expires_in
    };
    
  } catch (error) {
    throw new Error(`Failed to refresh Strava token: ${error.message}`);
  }
}

export function isTokenExpired(expiresAt) {
  return Date.now() / 1000 > expiresAt;
}

export async function getValidAccessToken(userTokens) {
  if (!isTokenExpired(userTokens.expires_at)) {
    return userTokens.access_token;
  }
  
  // Token is expired, refresh it
  const newTokens = await refreshAccessToken(userTokens.refresh_token);
  
  // In a real app, you would save the new tokens to the database here
  console.log('Token refreshed for user');
  
  return newTokens.access_token;
}

export function validateStravaWebhookRequest(req) {
  // In production, implement proper webhook signature validation
  // https://developers.strava.com/docs/webhooks/
  
  const event = req.body;
  
  if (!event.object_type || !event.object_id || !event.aspect_type) {
    throw new Error('Invalid webhook payload');
  }
  
  return {
    objectType: event.object_type,
    objectId: event.object_id,
    aspectType: event.aspect_type,
    ownerId: event.owner_id,
    subscriptionId: event.subscription_id,
    eventTime: event.event_time
  };
}

export async function getActivitySegmentEfforts(activityId, accessToken) {
  try {
    const response = await axios.get(
      `https://www.strava.com/api/v3/activities/${activityId}`,
      {
        params: { include_all_efforts: true },
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    
    return response.data.segment_efforts || [];
    
  } catch (error) {
    console.warn(`Could not fetch segment efforts for activity ${activityId}:`, error.message);
    return [];
  }
}