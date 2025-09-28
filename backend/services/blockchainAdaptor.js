import { ethers } from 'ethers';

// Blockchain adapter for PYUSD-based smart contracts
// Supports both Arbitrum Sepolia (for contracts) and Ethereum Sepolia (for PYUSD)

// Network configurations
const NETWORKS = {
  arbitrumSepolia: {
    rpcUrl: process.env.ARBITRUM_SEPOLIA_RPC || 'https://sepolia-rollup.arbitrum.io/rpc',
    chainId: 421614,
    pyusdAddress: process.env.PYUSD_ARBITRUM_SEPOLIA || '0x9A7b2c3c853b6c1D2A8F3eF3F3F6b6c8FB2e4A7D', // Replace with actual
  },
  sepolia: {
    rpcUrl: process.env.SEPOLIA_RPC || 'https://rpc.sepolia.org',
    chainId: 11155111,
    pyusdAddress: process.env.PYUSD_SEPOLIA || '0x9A7b2c3c853b6c1D2A8F3eF3F3F6b6c8FB2e4A7D', // Replace with actual
  }
};

const arbitrumProvider = new ethers.JsonRpcProvider(NETWORKS.arbitrumSepolia.rpcUrl);
const sepoliaProvider = new ethers.JsonRpcProvider(NETWORKS.sepolia.rpcUrl);

// Contract addresses (update after deployment)
const contractAddress = process.env.FITZONE_CONTRACT_ADDRESS || '0x1234567890123456789012345678901234567890';

// Contract ABI for FitZone contract (updated for PYUSD)
const contractABI = [
  'function claimZone(string calldata h3Index, uint256 baseScore) external',
  'function computeCurrentPower(uint256 score, uint256 lastCapturedAt) external view returns (uint256)',
  'function zones(uint256 tokenId) external view returns (string memory h3, uint256 lastCapturedAt, uint256 captureScore)',
  'function h3ToToken(string calldata h3Index) external view returns (uint256)',
  'function ownerOf(uint256 tokenId) external view returns (address)',
  'function captureFee() external view returns (uint256)',
  'function pyusdToken() external view returns (address)',
  'event ZoneCaptured(uint256 indexed tokenId, string indexed h3Index, address indexed newOwner, uint256 baseScore)'
];

// ERC20 ABI for PYUSD operations
const erc20ABI = [
  'function balanceOf(address owner) external view returns (uint256)',
  'function transfer(address to, uint256 amount) external returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) external returns (bool)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function decimals() external view returns (uint8)',
];

// Helper function to get PYUSD balance
export async function getPyusdBalance(userAddress, network = 'arbitrumSepolia') {
  try {
    const provider = network === 'sepolia' ? sepoliaProvider : arbitrumProvider;
    const pyusdAddress = NETWORKS[network].pyusdAddress;
    
    const pyusdContract = new ethers.Contract(pyusdAddress, erc20ABI, provider);
    const balance = await pyusdContract.balanceOf(userAddress);
    
    // PYUSD has 6 decimals
    return ethers.formatUnits(balance, 6);
  } catch (error) {
    console.error('Error getting PYUSD balance:', error);
    throw new Error(`Failed to get PYUSD balance: ${error.message}`);
  }
}

export async function mintZoneNFT(userId, h3Index, baseScore, userAddress = null) {
  try {
    // For demo purposes, return mock transaction data
    // In production, this would interact with the actual smart contract
    
    const mockTransactionHash = `0x${Math.random().toString(16).substr(2, 64)}`;
    const mockTokenId = Math.floor(Math.random() * 10000) + 1;
    const mockGasUsed = 85000 + Math.floor(Math.random() * 20000);
    
    // Calculate PYUSD fee (1 PYUSD = 1,000,000 units with 6 decimals)
    const captureFeeInPyusd = 1000000; // 1 PYUSD
    
    console.log('Minting Zone NFT:', {
      userId,
      h3Index,
      baseScore,
      contractAddress,
      estimatedGas: mockGasUsed,
      captureFeeInPyusd: ethers.formatUnits(captureFeeInPyusd, 6) + ' PYUSD'
    });
    
    // Check user's PYUSD balance (if userAddress provided)
    if (userAddress) {
      try {
        const balance = await getPyusdBalance(userAddress);
        console.log(`User PYUSD balance: ${balance} PYUSD`);
        
        if (parseFloat(balance) < 1) {
          throw new Error('Insufficient PYUSD balance for zone capture fee');
        }
      } catch (balanceError) {
        console.warn('Could not verify PYUSD balance:', balanceError.message);
      }
    }
    
    // Simulate blockchain delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      success: true,
      transactionHash: mockTransactionHash,
      tokenId: mockTokenId,
      contractAddress,
      gasUsed: mockGasUsed,
      blockNumber: 45234567 + Math.floor(Math.random() * 1000),
      confirmations: 1,
      mintedAt: new Date().toISOString(),
      paymentToken: 'PYUSD',
      feeAmount: ethers.formatUnits(captureFeeInPyusd, 6)
    };
    
  } catch (error) {
    console.error('NFT minting error:', error);
    throw new Error(`Failed to mint zone NFT: ${error.message}`);
  }
}

export async function getZoneOwnership(h3Index) {
  try {
    // Mock ownership data - in production, query the smart contract
    const mockOwnership = {
      exists: Math.random() > 0.3, // 70% chance zone is owned
      tokenId: Math.floor(Math.random() * 10000) + 1,
      owner: '0x' + Math.random().toString(16).substr(2, 40),
      captureScore: Math.floor(Math.random() * 1000) + 100,
      lastCapturedAt: Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000, // Random time in last week
      h3Index
    };
    
    console.log('Querying zone ownership:', { h3Index, ownership: mockOwnership });
    
    return mockOwnership;
    
  } catch (error) {
    console.error('Zone ownership query error:', error);
    throw new Error(`Failed to query zone ownership: ${error.message}`);
  }
}

export async function computeZonePower(captureScore, lastCapturedAt) {
  try {
    const now = Date.now();
    const capturedTime = typeof lastCapturedAt === 'string' ? new Date(lastCapturedAt).getTime() : lastCapturedAt;
    const ageInDays = (now - capturedTime) / (1000 * 60 * 60 * 24);
    const decay = Math.floor(ageInDays);
    
    const currentPower = Math.max(0, captureScore - decay);
    
    console.log('Computing zone power:', {
      captureScore,
      lastCapturedAt,
      ageInDays: ageInDays.toFixed(2),
      decay,
      currentPower
    });
    
    return currentPower;
    
  } catch (error) {
    console.error('Zone power computation error:', error);
    throw new Error(`Failed to compute zone power: ${error.message}`);
  }
}

export async function transferZoneOwnership(tokenId, fromAddress, toAddress) {
  try {
    // Mock transfer transaction
    const mockTransactionHash = `0x${Math.random().toString(16).substr(2, 64)}`;
    
    console.log('Transferring zone ownership:', {
      tokenId,
      fromAddress,
      toAddress,
      transactionHash: mockTransactionHash
    });
    
    // Simulate blockchain delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      success: true,
      transactionHash: mockTransactionHash,
      tokenId,
      fromAddress,
      toAddress,
      gasUsed: 65000 + Math.floor(Math.random() * 10000),
      blockNumber: 45234567 + Math.floor(Math.random() * 1000),
      transferredAt: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Zone transfer error:', error);
    throw new Error(`Failed to transfer zone: ${error.message}`);
  }
}

export async function getContractStats() {
  try {
    // Mock contract statistics
    const stats = {
      totalZonesMinted: Math.floor(Math.random() * 10000) + 5000,
      activeZones: Math.floor(Math.random() * 8000) + 3000,
      totalTransactions: Math.floor(Math.random() * 50000) + 25000,
      uniqueOwners: Math.floor(Math.random() * 2000) + 1000,
      averageZoneHoldTime: Math.random() * 10 + 2, // days
      totalValueLocked: (Math.random() * 100 + 50).toFixed(6) + ' ETH',
      contractBalance: (Math.random() * 10 + 5).toFixed(6) + ' ETH',
      lastBlockProcessed: 45234567 + Math.floor(Math.random() * 1000)
    };
    
    console.log('Contract stats retrieved:', stats);
    
    return stats;
    
  } catch (error) {
    console.error('Contract stats error:', error);
    throw new Error(`Failed to get contract stats: ${error.message}`);
  }
}

export async function estimateGasCost(operation, params = {}) {
  try {
    // Mock gas estimation based on operation type
    const gasEstimates = {
      claimZone: 85000 + Math.floor(Math.random() * 20000),
      transferZone: 65000 + Math.floor(Math.random() * 15000),
      updateMetadata: 45000 + Math.floor(Math.random() * 10000)
    };
    
    const gasLimit = gasEstimates[operation] || 50000;
    const gasPrice = 20 + Math.floor(Math.random() * 30); // Gwei
    const gasCost = gasLimit * gasPrice * 1e9; // Wei
    
    const estimate = {
      operation,
      gasLimit,
      gasPrice: gasPrice + ' Gwei',
      gasCostWei: gasCost.toString(),
      gasCostETH: (gasCost / 1e18).toFixed(8),
      estimatedUSD: '$' + (gasCost / 1e18 * 2500).toFixed(4) // Mock ETH price
    };
    
    console.log('Gas estimation:', estimate);
    
    return estimate;
    
  } catch (error) {
    console.error('Gas estimation error:', error);
    throw new Error(`Failed to estimate gas cost: ${error.message}`);
  }
}

export async function getRecentZoneEvents(limit = 20) {
  try {
    // Mock recent zone capture events
    const events = [];
    
    for (let i = 0; i < limit; i++) {
      const event = {
        eventType: Math.random() > 0.7 ? 'ZoneTransfer' : 'ZoneCapture',
        transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
        blockNumber: 45234567 - i * Math.floor(Math.random() * 10),
        timestamp: new Date(Date.now() - i * Math.random() * 3600000).toISOString(),
        tokenId: Math.floor(Math.random() * 10000) + 1,
        h3Index: `891fb466d${Math.random().toString(16).substr(2, 6)}`,
        fromAddress: i === 0 ? null : `0x${Math.random().toString(16).substr(2, 40)}`,
        toAddress: `0x${Math.random().toString(16).substr(2, 40)}`,
        captureScore: Math.floor(Math.random() * 1000) + 100,
        gasUsed: 85000 + Math.floor(Math.random() * 20000)
      };
      
      events.push(event);
    }
    
    console.log(`Retrieved ${events.length} recent zone events`);
    
    return events;
    
  } catch (error) {
    console.error('Zone events query error:', error);
    throw new Error(`Failed to get zone events: ${error.message}`);
  }
}

export async function validateZoneCapture(h3Index, baseScore, userAddress) {
  try {
    // Mock validation logic
    const currentOwnership = await getZoneOwnership(h3Index);
    
    if (currentOwnership.exists) {
      const currentPower = await computeZonePower(
        currentOwnership.captureScore,
        currentOwnership.lastCapturedAt
      );
      
      if (baseScore <= currentPower) {
        return {
          valid: false,
          reason: 'insufficient_score',
          required: currentPower + 1,
          provided: baseScore,
          currentOwner: currentOwnership.owner
        };
      }
    }
    
    // Check minimum score requirements
    if (baseScore < parseInt(process.env.MIN_ACTIVITY_POINTS) || 10) {
      return {
        valid: false,
        reason: 'minimum_score_not_met',
        required: parseInt(process.env.MIN_ACTIVITY_POINTS) || 10,
        provided: baseScore
      };
    }
    
    return {
      valid: true,
      canCapture: true,
      estimatedGas: await estimateGasCost('claimZone'),
      currentOwnership
    };
    
  } catch (error) {
    console.error('Zone capture validation error:', error);
    throw new Error(`Failed to validate zone capture: ${error.message}`);
  }
}

// Helper function to create a wallet from private key (for agent operations)
export function createAgentWallet() {
  try {
    if (!process.env.AGENT_PRIVATE_KEY) {
      throw new Error('Agent private key not configured');
    }
    
    const wallet = new ethers.Wallet(process.env.AGENT_PRIVATE_KEY, provider);
    
    console.log('Agent wallet created:', {
      address: wallet.address,
      network: provider.network?.name || 'unknown'
    });
    
    return wallet;
    
  } catch (error) {
    console.error('Agent wallet creation error:', error);
    throw new Error(`Failed to create agent wallet: ${error.message}`);
  }
}