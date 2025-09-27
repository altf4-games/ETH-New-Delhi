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
      const authUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/auth/strava`;
      const popup = window.open(
        authUrl, 
        'strava-auth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      // Listen for messages from popup
      const handleMessage = (event: MessageEvent) => {
        console.log('Received message:', event.data, 'from origin:', event.origin);
        
        // Allow messages from the same origin or localhost (for development)
        const allowedOrigins = [
          window.location.origin,
          'http://localhost:3000',
          'https://localhost:3000'
        ];
        
        if (!allowedOrigins.some(origin => event.origin === origin || event.origin.includes('localhost'))) {
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
          // Store Strava data
          localStorage.setItem('stravaAccessToken', event.data.access_token);
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

  return {
    ...strava,
    connectStrava,
    disconnectStrava,
  };
};