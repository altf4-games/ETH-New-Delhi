import { useState, useEffect } from 'react';
import { StravaService } from '../services/stravaService';

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
      const statsData = await StravaService.getStats();
      setStats(statsData);
    } catch (err: any) {
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