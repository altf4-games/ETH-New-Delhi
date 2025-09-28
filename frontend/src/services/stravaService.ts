interface StravaApiError extends Error {
  status?: number;
  needsReauth?: boolean;
}

export class StravaService {
  private static async refreshTokenIfNeeded(): Promise<string | null> {
    const accessToken = localStorage.getItem('stravaAccessToken');
    const refreshToken = localStorage.getItem('stravaRefreshToken');
    const expiresAt = localStorage.getItem('stravaExpiresAt');
    
    if (!accessToken || !refreshToken) {
      return null;
    }

    // Check if token is expired (with 5 minute buffer)
    if (expiresAt) {
      const expirationTime = parseInt(expiresAt) * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds

      if (currentTime >= (expirationTime - bufferTime)) {
        console.log('Token is expired or will expire soon, refreshing...');
        return await this.refreshToken(refreshToken);
      }
    }

    return accessToken;
  }

  private static async refreshToken(refreshToken: string): Promise<string | null> {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://eth.skillversus.xyz';
      const response = await fetch(`${apiUrl}/api/auth/strava/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken })
      });

      if (!response.ok) {
        console.error('Failed to refresh token:', response.status);
        return null;
      }

      const data = await response.json();
      
      // Update stored tokens
      localStorage.setItem('stravaAccessToken', data.access_token);
      if (data.refresh_token) {
        localStorage.setItem('stravaRefreshToken', data.refresh_token);
      }
      localStorage.setItem('stravaExpiresAt', data.expires_at?.toString() || '');

      console.log('Token refreshed successfully');
      return data.access_token;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return null;
    }
  }

  public static async makeAuthenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
    let accessToken = await this.refreshTokenIfNeeded();
    
    if (!accessToken) {
      const error: StravaApiError = new Error('No valid access token available');
      error.needsReauth = true;
      throw error;
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      }
    });

    // If we get a 401 and haven't tried refreshing yet, try once more
    if (response.status === 401) {
      const refreshToken = localStorage.getItem('stravaRefreshToken');
      if (refreshToken) {
        console.log('Got 401, attempting token refresh...');
        const newToken = await this.refreshToken(refreshToken);
        
        if (newToken && newToken !== accessToken) {
          // Try the request again with the new token
          const retryResponse = await fetch(url, {
            ...options,
            headers: {
              ...options.headers,
              'Authorization': `Bearer ${newToken}`,
              'Content-Type': 'application/json',
            }
          });
          
          if (retryResponse.ok || retryResponse.status !== 401) {
            return retryResponse;
          }
        }
      }
      
      // If refresh failed or didn't help, throw an error indicating re-auth is needed
      const error: StravaApiError = new Error('Authentication failed - please reconnect to Strava');
      error.status = 401;
      error.needsReauth = true;
      throw error;
    }

    return response;
  }

  public static async getStats() {
    try {
      const accessToken = await this.refreshTokenIfNeeded();
      const refreshToken = localStorage.getItem('stravaRefreshToken');
      const apiUrl = import.meta.env.VITE_API_URL || 'https://eth.skillversus.xyz';
      
      if (!accessToken) {
        throw new Error('Your Strava access token has expired. Please reconnect your Strava account.');
      }

      // Build the URL with both access token and refresh token
      const url = new URL(`${apiUrl}/api/activities/stats`);
      url.searchParams.set('stravaToken', accessToken);
      if (refreshToken) {
        url.searchParams.set('refreshToken', refreshToken);
      }

      const response = await fetch(url.toString());

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 401 || errorData.needsReauth) {
          const error: StravaApiError = new Error('Your Strava access token has expired. Please reconnect your Strava account.');
          error.needsReauth = true;
          throw error;
        }
        
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // If the backend refreshed the token, update our stored token
      if (data.refreshedToken && data.newAccessToken) {
        localStorage.setItem('stravaAccessToken', data.newAccessToken);
        console.log('Access token updated from backend refresh');
      }
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch stats');
      }

      return data.stats;
    } catch (error) {
      console.error('Error fetching Strava stats:', error);
      throw error;
    }
  }

  public static clearTokens() {
    localStorage.removeItem('stravaAccessToken');
    localStorage.removeItem('stravaRefreshToken');
    localStorage.removeItem('stravaExpiresAt');
    localStorage.removeItem('stravaAthlete');
  }

  public static async startRun(walletAddress: string, startLocation?: { lat: number; lng: number }) {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://eth.skillversus.xyz';
      
      const response = await fetch(`${apiUrl}/api/activities/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          walletAddress,
          startLocation 
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to start run');
      }

      return {
        activityId: data.activityId,
        startTime: data.startTime,
        startLocation: data.startLocation
      };
    } catch (error) {
      console.error('Error starting run:', error);
      throw error;
    }
  }

  public static async endRun(
    walletAddress: string, 
    options: {
      endLocation?: { lat: number; lng: number };
      totalDistance?: number;
      totalDuration?: number;
      routeData?: Array<{ lat: number; lng: number }>;
    }
  ) {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://eth.skillversus.xyz';
      
      const response = await fetch(`${apiUrl}/api/activities/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          walletAddress,
          ...options
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to end run');
      }

      return {
        activity: data.activity,
        message: data.message
      };
    } catch (error) {
      console.error('Error ending run:', error);
      throw error;
    }
  }

  public static async getCurrentRunStatus(walletAddress: string) {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://eth.skillversus.xyz';
      
      const response = await fetch(`${apiUrl}/api/activities/current?walletAddress=${encodeURIComponent(walletAddress)}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get run status');
      }

      return {
        isRunning: data.isRunning,
        activity: data.activity
      };
    } catch (error) {
      console.error('Error getting run status:', error);
      throw error;
    }
  }
}