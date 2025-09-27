import { useState, useEffect } from 'react';
import web3Service from '../services/web3Service';

interface UseWeb3Return {
  isConnected: boolean;
  userAddress: string | null;
  balance: string;
  loading: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

export const useWeb3 = (): UseWeb3Return => {
  const [isConnected, setIsConnected] = useState(false);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await web3Service.initialize();
      setIsConnected(web3Service.isConnected());
      setUserAddress(web3Service.getUserAddress());
      
      if (web3Service.isConnected()) {
        const userBalance = await web3Service.getBalance();
        setBalance(userBalance);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
      console.error('Web3 connection error:', err);
    } finally {
      setLoading(false);
    }
  };

  const disconnect = () => {
    web3Service.removeAllListeners();
    setIsConnected(false);
    setUserAddress(null);
    setBalance('0');
    setError(null);
  };

  // Check if already connected on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            await connect();
          }
        } catch (err) {
          console.error('Error checking existing connection:', err);
        }
      }
    };

    checkConnection();

    // Listen for account changes
    if (typeof window.ethereum !== 'undefined') {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnect();
        } else {
          connect();
        }
      };

      const handleChainChanged = () => {
        window.location.reload();
      };

      // Add event listeners (using any to bypass TypeScript issues)
      (window.ethereum as any).on?.('accountsChanged', handleAccountsChanged);
      (window.ethereum as any).on?.('chainChanged', handleChainChanged);

      return () => {
        // Remove event listeners
        (window.ethereum as any).removeListener?.('accountsChanged', handleAccountsChanged);
        (window.ethereum as any).removeListener?.('chainChanged', handleChainChanged);
      };
    }
  }, []);

  return {
    isConnected,
    userAddress,
    balance,
    loading,
    error,
    connect,
    disconnect
  };
};