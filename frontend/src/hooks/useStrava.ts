import { useState, useEffect } from 'react';

export interface StravaState {
  isConnected: boolean;
  athlete: {
    id?: number;
    name?: string;
    username?: string;
    profile_picture?: string;
  } | null;
  accessToken: string | null;
  isLoading: boolean;
}

export const useStrava = () => {
  const [strava, setStrava] = useState<StravaState>({
    isConnected: false,
    athlete: null,
    accessToken: null,
    isLoading: true,
  });

  useEffect(() => {
    // Check if Strava data is stored in localStorage
    const checkStravaConnection = () => {
      try {
        const storedToken = localStorage.getItem('stravaAccessToken');
        const storedAthlete = localStorage.getItem('stravaAthlete');
        
        if (storedToken && storedAthlete) {
          setStrava({
            isConnected: true,
            athlete: JSON.parse(storedAthlete),
            accessToken: storedToken,
            isLoading: false,
          });
        } else {
          setStrava({
            isConnected: false,
            athlete: null,
            accessToken: null,
            isLoading: false,
          });
        }
      } catch (error) {
        console.error('Error checking Strava connection:', error);
        setStrava({
          isConnected: false,
          athlete: null,
          accessToken: null,
          isLoading: false,
        });
      }
    };

    checkStravaConnection();

    // Listen for storage changes (in case Strava is connected/disconnected in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'stravaAccessToken' || e.key === 'stravaAthlete') {
        checkStravaConnection();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const connectStrava = (): Promise<boolean> => {
    return new Promise((resolve) => {
      setStrava(prev => ({ ...prev, isLoading: true }));

      // Open Strava OAuth in popup window
      const authUrl = `${import.meta.env.VITE_API_URL || 'https://eth.skillversus.xyz'}/api/auth/strava`;
      const popup = window.open(
        authUrl, 
        'strava-auth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      // Listen for messages from popup
      const handleMessage = (event: MessageEvent) => {
        console.log('Received message:', event.data, 'from origin:', event.origin);
        
        // Allow messages from the same origin or production backend (for deployment)
        const allowedOrigins = [
          window.location.origin,
          'https://eth.skillversus.xyz',
          'https://runft.vercel.app',
          'https://runft.netlify.app'
        ];
        
        if (!allowedOrigins.some(origin => event.origin === origin || event.origin.includes('localhost') || event.origin.includes('vercel.app') || event.origin.includes('netlify.app') || event.origin.includes('skillversus.xyz'))) {
          console.log('Message rejected due to origin:', event.origin);
          return;
        }

        // Filter out MetaMask and other extension messages
        if (!event.data || 
            event.data.target === 'metamask-inpage' ||
            event.data.target === 'metamask-contentscript' ||
            typeof event.data === 'string' ||
            !event.data.hasOwnProperty('success')) {
          console.log('Filtering out non-Strava message:', event.data);
          return;
        }

        if (event.data.success === true) {
          console.log('Strava connection successful!');
          // Store all Strava token data
          localStorage.setItem('stravaAccessToken', event.data.access_token);
          localStorage.setItem('stravaRefreshToken', event.data.refresh_token || '');
          localStorage.setItem('stravaExpiresAt', event.data.expires_at?.toString() || '');
          localStorage.setItem('stravaAthlete', JSON.stringify(event.data.athlete));
          
          setStrava({
            isConnected: true,
            athlete: event.data.athlete,
            accessToken: event.data.access_token,
            isLoading: false,
          });

          // Close popup
          if (popup) {
            popup.close();
          }

          window.removeEventListener('message', handleMessage);
          resolve(true);
        } else if (event.data.success === false) {
          console.log('Strava connection failed from server');
          setStrava(prev => ({ ...prev, isLoading: false }));
          console.error('Strava connection failed:', event.data.error || event.data.message || 'Unknown error');
          
          if (popup) {
            popup.close();
          }

          window.removeEventListener('message', handleMessage);
          resolve(false);
        }
      };

      window.addEventListener('message', handleMessage);

      // Check if popup was closed manually
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          setStrava(prev => ({ ...prev, isLoading: false }));
          window.removeEventListener('message', handleMessage);
          clearInterval(checkClosed);
          resolve(false);
        }
      }, 1000);

      // Timeout after 5 minutes
      setTimeout(() => {
        if (popup && !popup.closed) {
          popup.close();
        }
        setStrava(prev => ({ ...prev, isLoading: false }));
        window.removeEventListener('message', handleMessage);
        clearInterval(checkClosed);
        resolve(false);
      }, 300000);
    });
  };

  const disconnectStrava = () => {
    try {
      // Clear localStorage
      localStorage.removeItem('stravaAccessToken');
      localStorage.removeItem('stravaRefreshToken');
      localStorage.removeItem('stravaExpiresAt');
      localStorage.removeItem('stravaAthlete');
      
      // Update state
      setStrava({
        isConnected: false,
        athlete: null,
        accessToken: null,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error disconnecting Strava:', error);
    }
  };

  const refreshStravaToken = async (): Promise<string | null> => {
    try {
      const refreshToken = localStorage.getItem('stravaRefreshToken');
      if (!refreshToken) {
        console.warn('No refresh token available');
        return null;
      }

      const apiUrl = import.meta.env.VITE_API_URL || 'https://eth.skillversus.xyz';
      const response = await fetch(`${apiUrl}/api/auth/strava/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken })
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      
      // Update stored tokens
      localStorage.setItem('stravaAccessToken', data.access_token);
      if (data.refresh_token) {
        localStorage.setItem('stravaRefreshToken', data.refresh_token);
      }
      localStorage.setItem('stravaExpiresAt', data.expires_at?.toString() || '');

      // Update state
      setStrava(prev => ({
        ...prev,
        accessToken: data.access_token
      }));

      return data.access_token;
    } catch (error) {
      console.error('Token refresh failed:', error);
      // If refresh fails, disconnect user
      disconnectStrava();
      return null;
    }
  };

  const getValidAccessToken = async (): Promise<string | null> => {
    const accessToken = localStorage.getItem('stravaAccessToken');
    const expiresAt = localStorage.getItem('stravaExpiresAt');
    
    if (!accessToken) {
      return null;
    }

    // Check if token is expired (with 5 minute buffer)
    if (expiresAt) {
      const expirationTime = parseInt(expiresAt) * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds

      if (currentTime >= (expirationTime - bufferTime)) {
        console.log('Token is expired or will expire soon, refreshing...');
        return await refreshStravaToken();
      }
    }

    return accessToken;
  };

  return {
    ...strava,
    connectStrava,
    disconnectStrava,
    refreshStravaToken,
    getValidAccessToken,
  };
};