import { useState, useEffect } from 'react';
import web3Service from '../services/web3Service';

interface FitnessRun {
  runId: string;
  stakeAmount: string;
  targetDistance: string;
  estimatedTime: string;
  actualDistance?: string;
  actualTime?: string;
  startTime: Date;
  endTime?: Date | null;
  completed: boolean;
  claimed: boolean;
}

interface UseFitnessRunsReturn {
  activeRun: FitnessRun | null;
  runHistory: FitnessRun[];
  loading: boolean;
  error: string | null;
  startRun: (distanceMeters: number, estimatedTimeSeconds: number) => Promise<{ runId: string; stakeAmount: string; transactionHash?: string }>;
  completeRun: (runId: string, actualDistanceMeters: number, actualTimeSeconds: number) => Promise<{ success: boolean; reward: string }>;
  getSuggestedStake: (distanceMeters: number) => Promise<string>;
  refreshData: () => Promise<void>;
}

export const useFitnessRuns = (): UseFitnessRunsReturn => {
  const [activeRun, setActiveRun] = useState<FitnessRun | null>(null);
  const [runHistory, setRunHistory] = useState<FitnessRun[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshData = async () => {
    if (!web3Service.isConnected()) return;

    setLoading(true);
    try {
      const [active, history] = await Promise.all([
        web3Service.getActiveRun(),
        web3Service.getUserRunHistory()
      ]);
      
      setActiveRun(active);
      setRunHistory(history);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load run data');
    } finally {
      setLoading(false);
    }
  };

  const startRun = async (distanceMeters: number, estimatedTimeSeconds: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await web3Service.startFitnessRun(distanceMeters, estimatedTimeSeconds);
      await refreshData(); // Refresh to get the new active run
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to start run');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const completeRun = async (runId: string, actualDistanceMeters: number, actualTimeSeconds: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await web3Service.completeFitnessRun(runId, actualDistanceMeters, actualTimeSeconds);
      await refreshData(); // Refresh to update the run status
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to complete run');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getSuggestedStake = async (distanceMeters: number): Promise<string> => {
    try {
      return await web3Service.getSuggestedStake(distanceMeters);
    } catch (err: any) {
      console.warn('Failed to get suggested stake from contract:', err.message);
      // Don't set error state for rate limiting issues, just return fallback
      if (err.message?.includes('rate limit') || err.code === -32005) {
        // Fallback calculation
        const baseStake = (distanceMeters * 0.001) / 1000; // 0.001 ETH per km
        const withMotivation = baseStake * 1.5; // Add 50% motivation factor
        const finalStake = Math.max(withMotivation, 0.001); // Minimum 0.001 ETH
        return finalStake.toFixed(6);
      }
      setError(err.message || 'Failed to get suggested stake');
      throw err;
    }
  };

  // Listen for blockchain events
  useEffect(() => {
    if (web3Service.isConnected()) {
      const handleRunStarted = () => {
        refreshData();
      };

      const handleRunCompleted = () => {
        refreshData();
      };

      web3Service.onRunStarted(handleRunStarted);
      web3Service.onRunCompleted(handleRunCompleted);

      // Initial data load
      refreshData();

      return () => {
        web3Service.removeAllListeners();
      };
    }
  }, []);

  return {
    activeRun,
    runHistory,
    loading,
    error,
    startRun,
    completeRun,
    getSuggestedStake,
    refreshData
  };
};