import { useState, useEffect } from 'react';
import { useWallet } from './useWallet';
import { useStrava } from './useStrava';

export interface AuthState {
  isWalletConnected: boolean;
  isStravaConnected: boolean;
  isBothConnected: boolean;
  isLoading: boolean;
  walletAddress: string | null;
  stravaAthlete: {
    id?: number;
    name?: string;
    username?: string;
    profile_picture?: string;
  } | null;
}

export const useAuth = () => {
  const wallet = useWallet();
  const strava = useStrava();
  
  const [authState, setAuthState] = useState<AuthState>({
    isWalletConnected: false,
    isStravaConnected: false,
    isBothConnected: false,
    isLoading: true,
    walletAddress: null,
    stravaAthlete: null,
  });

  useEffect(() => {
    setAuthState({
      isWalletConnected: wallet.isConnected,
      isStravaConnected: strava.isConnected,
      isBothConnected: wallet.isConnected && strava.isConnected,
      isLoading: wallet.isLoading || strava.isLoading,
      walletAddress: wallet.address,
      stravaAthlete: strava.athlete,
    });
  }, [
    wallet.isConnected, 
    strava.isConnected, 
    wallet.isLoading, 
    strava.isLoading,
    wallet.address,
    strava.athlete
  ]);

  const connectWallet = async (): Promise<boolean> => {
    return await wallet.connectWallet();
  };

  const connectStrava = async (): Promise<boolean> => {
    return await strava.connectStrava();
  };

  const connectBoth = async (): Promise<{ wallet: boolean; strava: boolean }> => {
    const [walletResult, stravaResult] = await Promise.all([
      wallet.connectWallet(),
      strava.connectStrava()
    ]);

    return {
      wallet: walletResult,
      strava: stravaResult
    };
  };

  const disconnect = () => {
    wallet.disconnectWallet();
    strava.disconnectStrava();
  };

  return {
    ...authState,
    connectWallet,
    connectStrava,
    connectBoth,
    disconnect,
    formatWalletAddress: wallet.formatAddress,
  };
};