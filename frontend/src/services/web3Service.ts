import { ethers } from 'ethers';

// Extend window interface for ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

// Network configurations
export const NETWORKS = {
  arbitrumSepolia: {
    chainId: 421614,
    name: 'Arbitrum Sepolia',
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    explorerUrl: 'https://sepolia.arbiscan.io/',
    pyusdAddress: '0x9A7b2c3c853b6c1D2A8F3eF3F3F6b6c8FB2e4A7D', // Replace with actual PYUSD address
  },
  sepolia: {
    chainId: 11155111,
    name: 'Ethereum Sepolia',
    rpcUrl: 'https://rpc.sepolia.org',
    explorerUrl: 'https://sepolia.etherscan.io/',
    pyusdAddress: '0x9A7b2c3c853b6c1D2A8F3eF3F3F6b6c8FB2e4A7D', // Replace with actual PYUSD address
  },
};

// Contract addresses (update these after deployment)
export const CONTRACTS = {
  FITZONE: "0xDF850D656526925F3BC148dB4C66a46509FCde64", // Update with new deployed address
  FITSTAKING: "0xDF850D656526925F3BC148dB4C66a46509FCde64", // Update with new deployed address
  FITNFT: "0x6B219A0fD37A89D52Df66cbD9Ef59B1A56E88e49", // Update with new deployed address
};

// ERC20 ABI for PYUSD token interactions
export const ERC20_ABI = [
  "function balanceOf(address owner) external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) external returns (bool)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
  "function symbol() external view returns (string)",
  "function name() external view returns (string)",
];

// Contract ABIs (updated for PYUSD)
export const FITZONE_ABI = [
  "function claimZone(string calldata h3Index, uint256 baseScore) external",
  "function getZoneByH3(string calldata h3Index) external view returns (uint256 tokenId, address currentOwner, uint256 currentPower, uint256 originalScore, uint256 lastCapturedAt, address originalCapturer, uint256 totalCaptures)",
  "function canCaptureZone(string calldata h3Index, uint256 challengeScore) external view returns (bool canCapture, uint256 requiredScore, uint256 currentPower)",
  "function getOwnedZones(address owner) external view returns (uint256[] memory tokenIds)",
  "function captureFee() external view returns (uint256)",
  "function pyusdToken() external view returns (address)",
  "event ZoneCaptured(uint256 indexed tokenId, string indexed h3Index, address indexed newOwner, uint256 captureScore, uint256 timestamp)"
];

export const FITSTAKING_ABI = [
  "function startRun(uint256 targetDistance, uint256 estimatedTime, uint256 stakeAmount) external",
  "function completeRun(uint256 runId, uint256 actualDistance, uint256 actualTime) external",
  "function calculateSuggestedStake(uint256 distanceInMeters) external pure returns (uint256 suggestedStake)",
  "function getActiveRun(address user) external view returns (uint256 runId)",
  "function getRun(uint256 runId) external view returns (tuple(address runner, uint256 stakeAmount, uint256 targetDistance, uint256 estimatedTime, uint256 startTime, uint256 endTime, bool completed, bool claimed, uint256 actualDistance, uint256 actualTime))",
  "function getUserRuns(address user) external view returns (uint256[] memory)",
  "function MIN_STAKE() external view returns (uint256)",
  "function pyusdToken() external view returns (address)",
  "event RunStarted(uint256 indexed runId, address indexed runner, uint256 stakeAmount, uint256 targetDistance, uint256 estimatedTime)",
  "event RunCompleted(uint256 indexed runId, address indexed runner, bool success, uint256 actualDistance, uint256 actualTime, uint256 reward)"
];

export const FITNFT_ABI = [
  "function mintRunNFT(address runner, uint256 distance, uint256 duration, string memory zoneName, string memory zoneCoordinates, uint256 pointsEarned, string memory metadataURI) external returns (uint256)",
  "function listNFT(uint256 tokenId, uint256 price) external",
  "function buyNFT(uint256 tokenId, uint256 paymentAmount) external",
  "function cancelListing(uint256 tokenId) external",
  "function updatePrice(uint256 tokenId, uint256 newPrice) external",
  "function getListedNFTs() external view returns (tuple(uint256 tokenId, address seller, uint256 price, bool active, uint256 listedAt)[] memory)",
  "function getUserNFTs(address user) external view returns (uint256[] memory)",
  "function getRunData(uint256 tokenId) external view returns (tuple(address runner, uint256 distance, uint256 duration, uint256 timestamp, string zoneName, string zoneCoordinates, uint256 pointsEarned, uint256 averageSpeed))",
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "function tokenURI(uint256 tokenId) external view returns (string memory)",
  "function totalSupply() external view returns (uint256)",
  "function pyusdToken() external view returns (address)",
  "event NFTMinted(uint256 indexed tokenId, address indexed runner, uint256 distance, uint256 duration, string zoneName, uint256 pointsEarned)",
  "event NFTListed(uint256 indexed tokenId, address indexed seller, uint256 price)",
  "event NFTSold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price)",
  "event ListingCancelled(uint256 indexed tokenId, address indexed seller)"
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
    pyusdAddress: "0x9A7b2c3c853b6c1D2A8F3eF3F3F6b6c8FB2e4A7D", // Replace with actual PYUSD address
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
    pyusdAddress: "0x9A7b2c3c853b6c1D2A8F3eF3F3F6b6c8FB2e4A7D", // Replace with actual PYUSD address
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
    pyusdAddress: "0x0", // Not available on mainnet yet
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
      this.contracts.fitNFT = new ethers.Contract(CONTRACTS.FITNFT, FITNFT_ABI, this.signer);
      
      console.log('Contracts initialized:', {
        fitZone: this.contracts.fitZone.address,
        fitStaking: this.contracts.fitStaking.address,
        fitNFT: this.contracts.fitNFT.address
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

  // Get current network's PYUSD token address
  private getPyusdTokenAddress(): string {
    const network = NETWORKS.ARBITRUM_SEPOLIA; // Default to Arbitrum Sepolia
    return network.pyusdAddress;
  }

  // Get PYUSD token contract
  private getPyusdContract(): ethers.Contract {
    const pyusdAddress = this.getPyusdTokenAddress();
    if (!this.signer) throw new Error('No signer available');
    return new ethers.Contract(pyusdAddress, ERC20_ABI, this.signer);
  }

  // Get PYUSD balance for user
  async getPyusdBalance(userAddress?: string): Promise<string> {
    try {
      const pyusdContract = this.getPyusdContract();
      const address = userAddress || this.userAddress;
      if (!address) throw new Error('No user address available');

      const balance = await pyusdContract.balanceOf(address);
      return ethers.utils.formatUnits(balance, 6); // PYUSD has 6 decimals
    } catch (error) {
      console.error('Error getting PYUSD balance:', error);
      return '0';
    }
  }

  // Check PYUSD allowance
  async getPyusdAllowance(spenderAddress: string, userAddress?: string): Promise<string> {
    try {
      const pyusdContract = this.getPyusdContract();
      const address = userAddress || this.userAddress;
      if (!address) throw new Error('No user address available');

      const allowance = await pyusdContract.allowance(address, spenderAddress);
      return ethers.utils.formatUnits(allowance, 6);
    } catch (error) {
      console.error('Error getting PYUSD allowance:', error);
      return '0';
    }
  }

  // Approve PYUSD spending
  async approvePyusd(spenderAddress: string, amount: string): Promise<boolean> {
    try {
      const pyusdContract = this.getPyusdContract();
      const amountWei = ethers.utils.parseUnits(amount, 6);
      
      const tx = await pyusdContract.approve(spenderAddress, amountWei);
      console.log('PYUSD approval transaction:', tx.hash);
      
      await tx.wait();
      console.log('PYUSD approval confirmed');
      return true;
    } catch (error) {
      console.error('Error approving PYUSD:', error);
      return false;
    }
  }

  // Helper to ensure PYUSD approval before contract interaction
  private async ensurePyusdApproval(contractAddress: string, amount: string): Promise<void> {
    const currentAllowance = await this.getPyusdAllowance(contractAddress);
    const requiredAmount = parseFloat(amount);
    const currentAllowanceFloat = parseFloat(currentAllowance);

    if (currentAllowanceFloat < requiredAmount) {
      console.log(`Insufficient PYUSD allowance. Current: ${currentAllowance}, Required: ${amount}`);
      const approved = await this.approvePyusd(contractAddress, amount);
      if (!approved) {
        throw new Error('Failed to approve PYUSD spending');
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
      
      const stakeAmountFormatted = ethers.utils.formatUnits(suggestedStake, 6); // PYUSD has 6 decimals
      console.log('Starting run with PYUSD stake:', stakeAmountFormatted);
      
      // Ensure PYUSD approval before staking
      await this.ensurePyusdApproval(this.contracts.fitStaking.address, stakeAmountFormatted);
      
      // Start the run with retry (no ETH value needed, just PYUSD approval)
      const tx = await this.retryWithBackoff(async () => {
        return await this.contracts.fitStaking.startRun(
          distanceMeters,
          estimatedTimeSeconds,
          suggestedStake,
          { 
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
    // Ensure service is initialized
    if (!this.contracts.fitStaking || !this.signer) {
      console.log('Service not initialized, initializing now...');
      await this.initialize();
    }

    if (!this.contracts.fitStaking) {
      throw new Error('Staking contract not initialized');
    }

    console.log('Completing fitness run with params:', {
      runId,
      actualDistanceMeters,
      actualTimeSeconds
    });

    if (!runId || actualDistanceMeters <= 0 || actualTimeSeconds <= 0) {
      throw new Error(`Invalid parameters: runId=${runId}, distance=${actualDistanceMeters}, time=${actualTimeSeconds}`);
    }

    const tx = await this.contracts.fitStaking.completeRun(
      runId,
      actualDistanceMeters,
      actualTimeSeconds
    );
    
    console.log('Transaction submitted:', tx.hash);
    const receipt = await tx.wait();
    console.log('Transaction confirmed:', receipt);
    
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
    if (this.contracts.fitNFT) {
      this.contracts.fitNFT.removeAllListeners();
    }
  }

  // ========== NFT MARKETPLACE METHODS ==========

  // Mint NFT for user's own run
  async mintRunNFT(
    distance: string,
    duration: string, 
    zoneName: string,
    zoneCoordinates: string,
    pointsEarned: string,
    metadataURI: string
  ): Promise<string | null> {
    if (!this.contracts.fitNFT || !this.signer || !this.userAddress) {
      throw new Error('Contract, signer, or user address not initialized');
    }

    try {
      const contractWithSigner = this.contracts.fitNFT.connect(this.signer);
      
      const tx = await contractWithSigner.mintRunNFT(
        this.userAddress, // runner (user mints for themselves)
        distance,
        duration,
        zoneName,
        zoneCoordinates,
        pointsEarned,
        metadataURI
      );
      
      const receipt = await tx.wait();
      
      // Extract token ID from the mint event
      const mintEvent = receipt.events?.find((e: any) => e.event === 'NFTMinted');
      const tokenId = mintEvent ? mintEvent.args.tokenId.toString() : null;
      
      return tokenId;
    } catch (error) {
      console.error('Error minting NFT:', error);
      throw error;
    }
  }

  // Get user's NFTs
  async getUserNFTs(): Promise<NFTData[]> {
    if (!this.contracts.fitNFT || !this.userAddress) {
      return [];
    }

    try {
      const tokenIds = await this.contracts.fitNFT.getUserNFTs(this.userAddress);
      const nfts: NFTData[] = [];

      for (const tokenId of tokenIds) {
        const runData = await this.contracts.fitNFT.getRunData(tokenId);
        const tokenURI = await this.contracts.fitNFT.tokenURI(tokenId);
        const owner = await this.contracts.fitNFT.ownerOf(tokenId);

        nfts.push({
          tokenId: tokenId.toString(),
          owner,
          runData: {
            runner: runData.runner,
            distance: runData.distance.toString(),
            duration: runData.duration.toString(),
            timestamp: new Date(runData.timestamp.toNumber() * 1000),
            zoneName: runData.zoneName,
            zoneCoordinates: runData.zoneCoordinates,
            pointsEarned: runData.pointsEarned.toString(),
            averageSpeed: runData.averageSpeed.toString()
          },
          metadataURI: tokenURI,
          isListed: false // Will be updated if needed
        });
      }

      return nfts;
    } catch (error) {
      console.error('Error fetching user NFTs:', error);
      return [];
    }
  }

  // Get all listed NFTs for marketplace
  async getMarketplaceNFTs(): Promise<MarketplaceListing[]> {
    if (!this.contracts.fitNFT) {
      return [];
    }

    try {
      const listings = await this.contracts.fitNFT.getListedNFTs();
      const marketplaceNFTs: MarketplaceListing[] = [];

      for (const listing of listings) {
        const runData = await this.contracts.fitNFT.getRunData(listing.tokenId);
        const tokenURI = await this.contracts.fitNFT.tokenURI(listing.tokenId);

        marketplaceNFTs.push({
          tokenId: listing.tokenId.toString(),
          seller: listing.seller,
          price: ethers.utils.formatEther(listing.price),
          listedAt: new Date(listing.listedAt.toNumber() * 1000),
          runData: {
            runner: runData.runner,
            distance: runData.distance.toString(),
            duration: runData.duration.toString(),
            timestamp: new Date(runData.timestamp.toNumber() * 1000),
            zoneName: runData.zoneName,
            zoneCoordinates: runData.zoneCoordinates,
            pointsEarned: runData.pointsEarned.toString(),
            averageSpeed: runData.averageSpeed.toString()
          },
          metadataURI: tokenURI
        });
      }

      return marketplaceNFTs;
    } catch (error) {
      console.error('Error fetching marketplace NFTs:', error);
      return [];
    }
  }

  // List NFT for sale
  async listNFT(tokenId: string, priceInEth: string): Promise<boolean> {
    if (!this.contracts.fitNFT || !this.signer) {
      throw new Error('Contract or signer not initialized');
    }

    try {
      const priceInWei = ethers.utils.parseEther(priceInEth);
      const contractWithSigner = this.contracts.fitNFT.connect(this.signer);
      
      const tx = await contractWithSigner.listNFT(tokenId, priceInWei);
      await tx.wait();
      
      return true;
    } catch (error) {
      console.error('Error listing NFT:', error);
      throw error;
    }
  }

  // Buy NFT from marketplace
  async buyNFT(tokenId: string, priceInPyusd: string): Promise<boolean> {
    if (!this.contracts.fitNFT || !this.signer) {
      throw new Error('Contract or signer not initialized');
    }

    try {
      const priceInTokens = ethers.utils.parseUnits(priceInPyusd, 6); // PYUSD has 6 decimals
      const contractWithSigner = this.contracts.fitNFT.connect(this.signer);
      
      // Ensure PYUSD approval before purchase
      await this.ensurePyusdApproval(this.contracts.fitNFT.address, priceInPyusd);
      
      const tx = await contractWithSigner.buyNFT(tokenId, priceInTokens);
      await tx.wait();
      
      return true;
    } catch (error) {
      console.error('Error buying NFT:', error);
      throw error;
    }
  }

  // Cancel NFT listing
  async cancelListing(tokenId: string): Promise<boolean> {
    if (!this.contracts.fitNFT || !this.signer) {
      throw new Error('Contract or signer not initialized');
    }

    try {
      const contractWithSigner = this.contracts.fitNFT.connect(this.signer);
      
      const tx = await contractWithSigner.cancelListing(tokenId);
      await tx.wait();
      
      return true;
    } catch (error) {
      console.error('Error canceling listing:', error);
      throw error;
    }
  }

  // Update listing price
  async updatePrice(tokenId: string, newPriceInEth: string): Promise<boolean> {
    if (!this.contracts.fitNFT || !this.signer) {
      throw new Error('Contract or signer not initialized');
    }

    try {
      const priceInWei = ethers.utils.parseEther(newPriceInEth);
      const contractWithSigner = this.contracts.fitNFT.connect(this.signer);
      
      const tx = await contractWithSigner.updatePrice(tokenId, priceInWei);
      await tx.wait();
      
      return true;
    } catch (error) {
      console.error('Error updating price:', error);
      throw error;
    }
  }

  // Listen for NFT events
  onNFTMinted(callback: (...args: any[]) => void): void {
    if (this.contracts.fitNFT) {
      this.contracts.fitNFT.on('NFTMinted', callback);
    }
  }

  onNFTListed(callback: (...args: any[]) => void): void {
    if (this.contracts.fitNFT) {
      this.contracts.fitNFT.on('NFTListed', callback);
    }
  }

  onNFTSold(callback: (...args: any[]) => void): void {
    if (this.contracts.fitNFT) {
      this.contracts.fitNFT.on('NFTSold', callback);
    }
  }

  // Get user address
  getUserAddress(): string | null {
    return this.userAddress;
  }

  // Check if wallet is connected and contracts are initialized
  isConnected(): boolean {
    return !!(this.userAddress && this.contracts.fitStaking);
  }
}

// Type definitions for NFT data
export interface NFTRunData {
  runner: string;
  distance: string;
  duration: string;
  timestamp: Date;
  zoneName: string;
  zoneCoordinates: string;
  pointsEarned: string;
  averageSpeed: string;
}

export interface NFTData {
  tokenId: string;
  owner: string;
  runData: NFTRunData;
  metadataURI: string;
  isListed: boolean;
}

export interface MarketplaceListing {
  tokenId: string;
  seller: string;
  price: string;
  listedAt: Date;
  runData: NFTRunData;
  metadataURI: string;
}

export default new Web3Service();