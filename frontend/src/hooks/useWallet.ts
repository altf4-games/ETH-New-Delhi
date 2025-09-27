import { useState, useEffect } from 'react';

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  isLoading: boolean;
}

export const useWallet = () => {
  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false,
    address: null,
    isLoading: true,
  });

  useEffect(() => {
    // Check if wallet address is stored in localStorage
    const checkWalletConnection = () => {
      try {
        const storedAddress = localStorage.getItem('walletAddress');
        if (storedAddress) {
          setWallet({
            isConnected: true,
            address: storedAddress,
            isLoading: false,
          });
        } else {
          setWallet({
            isConnected: false,
            address: null,
            isLoading: false,
          });
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
        setWallet({
          isConnected: false,
          address: null,
          isLoading: false,
        });
      }
    };

    checkWalletConnection();

    // Listen for storage changes (in case wallet is connected/disconnected in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'walletAddress') {
        checkWalletConnection();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const formatAddress = (address: string): string => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const connectWallet = async (): Promise<boolean> => {
    if (typeof window.ethereum === 'undefined') {
      alert('Please install MetaMask to use this feature');
      return false;
    }

    try {
      setWallet(prev => ({ ...prev, isLoading: true }));
      
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (accounts.length > 0) {
        const address = accounts[0];
        localStorage.setItem('walletAddress', address);
        setWallet({
          isConnected: true,
          address,
          isLoading: false,
        });
        return true;
      }
      
      setWallet(prev => ({ ...prev, isLoading: false }));
      return false;
      
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setWallet(prev => ({ ...prev, isLoading: false }));
      alert('Please connect your MetaMask wallet to continue');
      return false;
    }
  };

  const disconnectWallet = async () => {
    try {
      // Clear localStorage
      localStorage.removeItem('walletAddress');
      
      // Update state
      setWallet({
        isConnected: false,
        address: null,
        isLoading: false,
      });

      // Try to revoke permissions if possible
      if (typeof window.ethereum !== 'undefined') {
        try {
          await window.ethereum.request({
            method: "wallet_revokePermissions",
            params: [{ eth_accounts: {} }]
          });
        } catch (revokeError) {
          // Revoking permissions might not be supported by all wallets
          console.log('Could not revoke permissions:', revokeError);
        }
      }
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  };

  return {
    ...wallet,
    formatAddress,
    connectWallet,
    disconnectWallet,
  };
};