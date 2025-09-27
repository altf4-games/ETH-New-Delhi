import { useState, useEffect } from 'react';
import { useStrava } from './useStrava';

export interface StravaStats {
  totalKilometers: number;
  totalActivities: number;
  totalMovingTimeHours: number;
  totalElevationGain: number;
  recentKilometers: number;
  recentActivities: number;
  lastActivity: {
    name: string;
    date: string;
    distance: number;
    movingTime: number;
  } | null;
}

export interface UseStravaStatsReturn {
  stats: StravaStats | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useStravaStats = (accessToken: string | null): UseStravaStatsReturn => {
  const [stats, setStats] = useState<StravaStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getValidAccessToken } = useStrava();

  const fetchStats = async () => {
    if (!accessToken) {
      setStats(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    console.log('Fetching Strava stats...');
    setIsLoading(true);
    setError(null);

    try {
      // Get a valid (possibly refreshed) access token
      const validToken = await getValidAccessToken();
      
      if (!validToken) {
        throw new Error('Unable to get valid access token');
      }

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(
        `${apiUrl}/api/activities/stats?stravaToken=${encodeURIComponent(validToken)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      } else {
        throw new Error(data.message || 'Failed to fetch stats');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch Strava stats';
      setError(errorMessage);
      console.error('Error fetching Strava stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const refetch = () => {
    fetchStats();
  };

  useEffect(() => {
    fetchStats();
  }, [accessToken]);

  return {
    stats,
    isLoading,
    error,
    refetch
  };
};