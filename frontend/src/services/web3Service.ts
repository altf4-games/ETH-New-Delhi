import { ethers } from 'ethers';

// Extend window interface for ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

// Contract addresses (update these after deployment)
export const CONTRACTS = {
  FITZONE: "0xDF850D656526925F3BC148dB4C66a46509FCde64", // Your deployed FitStaking contract
  FITSTAKING: "0xDF850D656526925F3BC148dB4C66a46509FCde64", // Same contract for now
};

// Contract ABIs (simplified for key functions)
export const FITZONE_ABI = [
  "function claimZone(string calldata h3Index, uint256 baseScore) external payable",
  "function getZoneByH3(string calldata h3Index) external view returns (uint256 tokenId, address currentOwner, uint256 currentPower, uint256 originalScore, uint256 lastCapturedAt, address originalCapturer, uint256 totalCaptures)",
  "function canCaptureZone(string calldata h3Index, uint256 challengeScore) external view returns (bool canCapture, uint256 requiredScore, uint256 currentPower)",
  "function getOwnedZones(address owner) external view returns (uint256[] memory tokenIds)",
  "function captureFee() external view returns (uint256)",
  "event ZoneCaptured(uint256 indexed tokenId, string indexed h3Index, address indexed newOwner, uint256 captureScore, uint256 timestamp)"
];

export const FITSTAKING_ABI = [
  "function startRun(uint256 targetDistance, uint256 estimatedTime) external payable",
  "function completeRun(uint256 runId, uint256 actualDistance, uint256 actualTime) external",
  "function calculateSuggestedStake(uint256 distanceInMeters) external pure returns (uint256 suggestedStake)",
  "function getActiveRun(address user) external view returns (uint256 runId)",
  "function getRun(uint256 runId) external view returns (tuple(address runner, uint256 stakeAmount, uint256 targetDistance, uint256 estimatedTime, uint256 startTime, uint256 endTime, bool completed, bool claimed, uint256 actualDistance, uint256 actualTime))",
  "function getUserRuns(address user) external view returns (uint256[] memory)",
  "function MIN_STAKE() external view returns (uint256)",
  "event RunStarted(uint256 indexed runId, address indexed runner, uint256 stakeAmount, uint256 targetDistance, uint256 estimatedTime)",
  "event RunCompleted(uint256 indexed runId, address indexed runner, bool success, uint256 actualDistance, uint256 actualTime, uint256 reward)"
];

// Network configurations
export const NETWORKS = {
  ARBITRUM_SEPOLIA: {
    chainId: 421614,
    name: "Arbitrum Sepolia",
    rpcUrl: "https://sepolia-rollup.arbitrum.io/rpc",
    fallbackRpcUrls: [
      "https://arbitrum-sepolia.blockpi.network/v1/rpc/public",
      "https://arbitrum-sepolia-rpc.allthatnode.com",
      "https://arbitrum-sepolia.drpc.org"
    ],
    blockExplorer: "https://sepolia.arbiscan.io/",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
  },
  ZKSYNC_SEPOLIA: {
    chainId: 300,
    name: "ZkSync Era Sepolia Testnet",
    rpcUrl: "https://sepolia.era.zksync.dev",
    fallbackRpcUrls: [],
    blockExplorer: "https://sepolia.explorer.zksync.io/",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
  },
  ZKSYNC_MAINNET: {
    chainId: 324,
    name: "ZkSync Era Mainnet",
    rpcUrl: "https://mainnet.era.zksync.io",
    fallbackRpcUrls: [],
    blockExplorer: "https://explorer.zksync.io/",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
  },
};

// Default to Arbitrum Sepolia since that's where the contract is deployed
export const NETWORK_CONFIG = NETWORKS.ARBITRUM_SEPOLIA;

interface RunDetails {
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

class Web3Service {
  private provider: ethers.providers.Web3Provider | null = null;
  private signer: ethers.Signer | null = null;
  private contracts: { [key: string]: ethers.Contract } = {};
  private userAddress: string | null = null;
  private lastCallTime: number = 0;
  private minCallInterval: number = 2000; // Increased to 2 seconds between calls
  private retryCount: number = 0;
  private maxRetries: number = 3;

  constructor() {}

  // Helper method for retry logic with exponential backoff
  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<T> {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        // Add delay before each attempt (except first)
        if (attempt > 1) {
          const delay = Math.pow(2, attempt - 1) * 1000; // Exponential backoff
          console.log(`Retrying ${context} in ${delay}ms (attempt ${attempt}/${this.maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        const result = await operation();
        return result;
      } catch (error: any) {
        console.log(`Attempt ${attempt}/${this.maxRetries} failed for ${context}:`, error.message);
        
        // If it's a rate limit error and we have retries left, continue
        if (error.code === -32005 && attempt < this.maxRetries) {
          continue;
        }
        
        // If it's the last attempt or not a rate limit error, throw
        throw error;
      }
    }
    throw new Error(`All retry attempts failed for ${context}`);
  }

  // Initialize Web3 connection
  async initialize(): Promise<boolean> {
    if (typeof window.ethereum !== 'undefined') {
      this.provider = new ethers.providers.Web3Provider(window.ethereum);
      
      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Check current network
      const network = await this.provider.getNetwork();
      console.log('Connected to network:', network);
      console.log('Target network:', NETWORK_CONFIG);
      
      // For now, let's be flexible with networks for testing
      // Only switch if we're on localhost or a different testnet
      if (network.chainId === 1337 || network.chainId === 31337) { // localhost
        console.log('On localhost, trying to switch to Arbitrum Sepolia...');
        try {
          await this.switchToCorrectNetwork();
        } catch (err) {
          console.log('Could not switch network, continuing with current network');
        }
      } else if (network.chainId !== NETWORK_CONFIG.chainId) {
        console.log('Wrong network detected, switching to Arbitrum Sepolia...');
        try {
          await this.switchToCorrectNetwork();
        } catch (err) {
          console.log('Could not switch network, continuing with current network');
        }
      }
      
      this.signer = this.provider.getSigner();
      this.userAddress = await this.signer.getAddress();
      
      // Initialize contracts
      this.contracts.fitZone = new ethers.Contract(CONTRACTS.FITZONE, FITZONE_ABI, this.signer);
      this.contracts.fitStaking = new ethers.Contract(CONTRACTS.FITSTAKING, FITSTAKING_ABI, this.signer);
      
      console.log('Contracts initialized:', {
        fitZone: this.contracts.fitZone.address,
        fitStaking: this.contracts.fitStaking.address
      });
      
      // Verify contract exists
      const code = await this.provider.getCode(CONTRACTS.FITSTAKING);
      console.log('Contract code length:', code.length);
      if (code === '0x') {
        throw new Error('Contract not found at address: ' + CONTRACTS.FITSTAKING);
      }
      
      return true;
    } else {
      throw new Error('MetaMask is not installed');
    }
  }

  // Switch to the correct network (Arbitrum Sepolia)
  async switchToCorrectNetwork(): Promise<void> {
    try {
      await window.ethereum?.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${NETWORK_CONFIG.chainId.toString(16)}` }],
      });
    } catch (switchError: any) {
      // If the chain hasn't been added to MetaMask, add it
      if (switchError.code === 4902) {
        await window.ethereum?.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: `0x${NETWORK_CONFIG.chainId.toString(16)}`,
            chainName: NETWORK_CONFIG.name,
            nativeCurrency: NETWORK_CONFIG.nativeCurrency,
            rpcUrls: [NETWORK_CONFIG.rpcUrl],
            blockExplorerUrls: [NETWORK_CONFIG.blockExplorer],
          }],
        });
      } else {
        throw switchError;
      }
    }
  }

  // Start a new fitness run with staking
  async startFitnessRun(distanceMeters: number, estimatedTimeSeconds: number) {
    if (!this.contracts.fitStaking) {
      throw new Error('Staking contract not initialized');
    }

    return await this.retryWithBackoff(async () => {
      // Add rate limiting delay
      const now = Date.now();
      const timeSinceLastCall = now - this.lastCallTime;
      if (timeSinceLastCall < this.minCallInterval) {
        await new Promise(resolve => setTimeout(resolve, this.minCallInterval - timeSinceLastCall));
      }
      this.lastCallTime = Date.now();

      // Get suggested stake amount with retry
      const suggestedStake = await this.retryWithBackoff(async () => {
        return await this.contracts.fitStaking.calculateSuggestedStake(distanceMeters);
      }, 'calculateSuggestedStake');
      
      console.log('Starting run with stake:', ethers.utils.formatEther(suggestedStake));
      
      // Start the run with retry
      const tx = await this.retryWithBackoff(async () => {
        return await this.contracts.fitStaking.startRun(
          distanceMeters,
          estimatedTimeSeconds,
          { 
            value: suggestedStake,
            gasLimit: 300000 // Set explicit gas limit to avoid estimation issues
          }
        );
      }, 'startRun transaction');
      
      console.log('Transaction submitted:', tx.hash);
      
      // Wait for confirmation with retry
      const receipt = await this.retryWithBackoff(async () => {
        return await tx.wait();
      }, 'transaction confirmation');
      
      // Extract run ID from events
      const runStartedEvent = receipt.events?.find((e: any) => e.event === 'RunStarted');
      const runId = runStartedEvent?.args?.runId;
      
      return {
        runId: runId?.toString(),
        stakeAmount: ethers.utils.formatEther(suggestedStake),
        transactionHash: receipt.transactionHash
      };
    }, 'startFitnessRun');
  }

  // Complete a fitness run
  async completeFitnessRun(runId: string, actualDistanceMeters: number, actualTimeSeconds: number) {
    if (!this.contracts.fitStaking) {
      throw new Error('Staking contract not initialized');
    }

    const tx = await this.contracts.fitStaking.completeRun(
      runId,
      actualDistanceMeters,
      actualTimeSeconds
    );
    
    const receipt = await tx.wait();
    
    // Extract completion event
    const completedEvent = receipt.events?.find((e: any) => e.event === 'RunCompleted');
    
    return {
      success: completedEvent?.args?.success,
      reward: ethers.utils.formatEther(completedEvent?.args?.reward || 0),
      transactionHash: receipt.transactionHash
    };
  }

  // Get suggested stake amount for a distance
  async getSuggestedStake(distanceMeters: number): Promise<string> {
    if (!this.contracts.fitStaking) {
      throw new Error('Staking contract not initialized');
    }

    try {
      return await this.retryWithBackoff(async () => {
        // Rate limiting to prevent MetaMask rate limit errors
        const now = Date.now();
        const timeSinceLastCall = now - this.lastCallTime;
        if (timeSinceLastCall < this.minCallInterval) {
          await new Promise(resolve => setTimeout(resolve, this.minCallInterval - timeSinceLastCall));
        }
        this.lastCallTime = Date.now();

        console.log('Calling calculateSuggestedStake with:', distanceMeters);
        
        // Try the contract call
        const suggestedStake = await this.contracts.fitStaking.calculateSuggestedStake(distanceMeters);
        console.log('Contract returned stake:', suggestedStake.toString());
        
        const formatted = ethers.utils.formatEther(suggestedStake);
        console.log('Formatted suggested stake:', formatted);
        
        return formatted;
      }, 'getSuggestedStake');
    } catch (error: any) {
      console.error('Error in getSuggestedStake after retries:', error);
      // If there's a rate limit error, return a fallback calculation
      if (error.message?.includes('rate limit') || error.code === -32005) {
        console.log('Rate limited, using fallback calculation');
        // Fallback calculation: 0.001 ETH per km + 50% motivation factor
        const baseStake = (distanceMeters * 0.001) / 1000; // 0.001 ETH per km
        const withMotivation = baseStake * 1.5; // Add 50% motivation factor
        const finalStake = Math.max(withMotivation, 0.001); // Minimum 0.001 ETH
        return finalStake.toFixed(6);
      }
      throw error;
    }
  }

  // Get active run for current user
  async getActiveRun(): Promise<RunDetails | null> {
    if (!this.contracts.fitStaking || !this.userAddress) {
      return null;
    }

    const activeRunId = await this.contracts.fitStaking.getActiveRun(this.userAddress);
    
    if (activeRunId.toString() === '0') {
      return null;
    }

    const runDetails = await this.contracts.fitStaking.getRun(activeRunId);
    
    return {
      runId: activeRunId.toString(),
      stakeAmount: ethers.utils.formatEther(runDetails.stakeAmount),
      targetDistance: runDetails.targetDistance.toString(),
      estimatedTime: runDetails.estimatedTime.toString(),
      startTime: new Date(runDetails.startTime.toNumber() * 1000),
      completed: runDetails.completed,
      claimed: runDetails.claimed
    };
  }

  // Get user's run history
  async getUserRunHistory(): Promise<RunDetails[]> {
    if (!this.contracts.fitStaking || !this.userAddress) {
      return [];
    }

    const runIds = await this.contracts.fitStaking.getUserRuns(this.userAddress);
    const runs: RunDetails[] = [];

    for (const runId of runIds) {
      const runDetails = await this.contracts.fitStaking.getRun(runId);
      runs.push({
        runId: runId.toString(),
        stakeAmount: ethers.utils.formatEther(runDetails.stakeAmount),
        targetDistance: runDetails.targetDistance.toString(),
        estimatedTime: runDetails.estimatedTime.toString(),
        actualDistance: runDetails.actualDistance.toString(),
        actualTime: runDetails.actualTime.toString(),
        startTime: new Date(runDetails.startTime.toNumber() * 1000),
        endTime: runDetails.endTime.toNumber() > 0 ? new Date(runDetails.endTime.toNumber() * 1000) : null,
        completed: runDetails.completed,
        claimed: runDetails.claimed
      });
    }

    return runs.reverse(); // Most recent first
  }

  // Get user's ETH balance
  async getBalance(): Promise<string> {
    if (!this.provider || !this.userAddress) {
      return '0';
    }

    const balance = await this.provider.getBalance(this.userAddress);
    return ethers.utils.formatEther(balance);
  }

  // Listen for contract events
  onRunStarted(callback: (...args: any[]) => void): void {
    if (this.contracts.fitStaking) {
      this.contracts.fitStaking.on('RunStarted', callback);
    }
  }

  onRunCompleted(callback: (...args: any[]) => void): void {
    if (this.contracts.fitStaking) {
      this.contracts.fitStaking.on('RunCompleted', callback);
    }
  }

  // Cleanup event listeners
  removeAllListeners(): void {
    if (this.contracts.fitStaking) {
      this.contracts.fitStaking.removeAllListeners();
    }
    if (this.contracts.fitZone) {
      this.contracts.fitZone.removeAllListeners();
    }
  }

  // Get user address
  getUserAddress(): string | null {
    return this.userAddress;
  }

  // Check if wallet is connected
  isConnected(): boolean {
    return !!this.userAddress;
  }
}

export default new Web3Service();