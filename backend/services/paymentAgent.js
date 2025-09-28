import { ethers } from 'ethers';
import { createAgentWallet } from './blockchainAdapter.js';

const agentWallet = createAgentWallet();

// PYUSD token configuration
const PYUSD_CONFIG = {
  arbitrumSepolia: {
    address: process.env.PYUSD_ARBITRUM_SEPOLIA || '0x9A7b2c3c853b6c1D2A8F3eF3F3F6b6c8FB2e4A7D',
    decimals: 6
  },
  sepolia: {
    address: process.env.PYUSD_SEPOLIA || '0x9A7b2c3c853b6c1D2A8F3eF3F3F6b6c8FB2e4A7D',
    decimals: 6
  }
};

// ERC20 ABI for PYUSD operations
const erc20ABI = [
  'function transfer(address to, uint256 amount) external returns (bool)',
  'function balanceOf(address owner) external view returns (uint256)',
  'function decimals() external view returns (uint8)',
  'function symbol() external view returns (string)',
];

export async function distributeReward(rewardData) {
  const { type, recipientId, amount, metadata, network = 'arbitrumSepolia' } = rewardData;
  
  try {
    // Generate unique reward ID
    const rewardId = `reward_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Mock recipient address - in production, get from user profile
    const recipientAddress = `0x${Math.random().toString(16).padStart(40, '0')}`;
    
    console.log('Processing PYUSD reward distribution:', {
      rewardId,
      type,
      recipientId,
      recipientAddress,
      amount,
      metadata,
      network
    });
    
    // Get PYUSD configuration for network
    const pyusdConfig = PYUSD_CONFIG[network];
    if (!pyusdConfig) {
      throw new Error(`PYUSD not configured for network: ${network}`);
    }
    
    // Convert amount to token units (6 decimals for PYUSD)
    const amountTokens = ethers.parseUnits(amount.toString(), pyusdConfig.decimals);
    
    // Create PYUSD contract instance
    const pyusdContract = new ethers.Contract(pyusdConfig.address, erc20ABI, agentWallet);
    
    // Validate agent wallet has sufficient PYUSD balance
    const balance = await pyusdContract.balanceOf(agentWallet.address);
    if (balance < amountTokens) {
      const balanceFormatted = ethers.formatUnits(balance, pyusdConfig.decimals);
      const requiredFormatted = ethers.formatUnits(amountTokens, pyusdConfig.decimals);
      throw new Error(`Insufficient agent wallet PYUSD balance. Required: ${requiredFormatted}, Available: ${balanceFormatted}`);
    }
    
    // For demo, simulate transaction without actually sending
    const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`;
    
    console.log('PYUSD reward transaction prepared:', {
      rewardId,
      transactionHash: mockTxHash,
      to: recipientAddress,
      tokenAmount: ethers.formatUnits(amountTokens, pyusdConfig.decimals) + ' PYUSD',
      tokenAddress: pyusdConfig.address,
      network
    });
    
    // Simulate blockchain processing time
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Record transaction in agent logs
    await logAgentTransaction({
      rewardId,
      transactionHash: mockTxHash,
      type,
      recipientId,
      recipientAddress,
      amount: amountWei.toString(),
      status: 'confirmed',
      blockNumber: 45234567 + Math.floor(Math.random() * 1000),
      gasUsed: 21000,
      gasPrice: tx.gasPrice.toString(),
      timestamp: new Date().toISOString(),
      metadata
    });
    
    return {
      rewardId,
      transactionHash: mockTxHash,
      status: 'confirmed',
      blockNumber: 45234567 + Math.floor(Math.random() * 1000),
      gasUsed: 21000,
      confirmations: 1
    };
    
  } catch (error) {
    console.error('Reward distribution error:', error);
    
    // Log failed transaction
    await logAgentTransaction({
      rewardId: rewardData.rewardId || `failed_${Date.now()}`,
      type,
      recipientId,
      amount: amount.toString(),
      status: 'failed',
      error: error.message,
      timestamp: new Date().toISOString(),
      metadata
    });
    
    throw error;
  }
}

export async function handleDispute(disputeData) {
  const { transactionHash, reason, evidence, reportedBy } = disputeData;
  
  try {
    const disputeId = `dispute_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('Processing dispute:', {
      disputeId,
      transactionHash,
      reason,
      reportedBy
    });
    
    // Validate transaction exists
    const transaction = await getTransactionByHash(transactionHash);
    if (!transaction) {
      throw new Error('Transaction not found');
    }
    
    // Analyze dispute validity
    const analysis = await analyzeDispute(transaction, reason, evidence);
    
    // Auto-resolve simple cases
    if (analysis.autoResolvable) {
      const resolution = await resolveDispute(disputeId, analysis.resolution, 'agent_auto');
      return {
        disputeId,
        status: 'auto_resolved',
        resolution: resolution.action,
        processedAt: new Date().toISOString()
      };
    }
    
    // Queue for manual review
    await queueManualReview(disputeId, {
      transactionHash,
      reason,
      evidence,
      reportedBy,
      analysis,
      createdAt: new Date().toISOString()
    });
    
    return {
      disputeId,
      status: 'pending_review',
      estimatedResolutionTime: '24 hours',
      reviewQueuePosition: Math.floor(Math.random() * 5) + 1
    };
    
  } catch (error) {
    console.error('Dispute handling error:', error);
    throw new Error(`Failed to process dispute: ${error.message}`);
  }
}

export async function getAgentStatus() {
  try {
    const balance = await agentWallet.provider.getBalance(agentWallet.address);
    const gasPrice = await agentWallet.provider.getFeeData();
    
    // Mock performance data
    const performanceData = await getAgentPerformance();
    
    return {
      status: 'active',
      uptime: Math.floor(Math.random() * 168) + ' hours', // Mock uptime
      lastHealthCheck: new Date().toISOString(),
      wallet: {
        address: agentWallet.address,
        balance: balance.toString(),
        balanceETH: ethers.formatEther(balance),
        networkId: (await agentWallet.provider.getNetwork()).chainId.toString(),
        gasPrice: gasPrice.gasPrice?.toString() || '20000000000'
      },
      performance: performanceData,
      recentTransactions: await getRecentTransactions()
    };
    
  } catch (error) {
    console.error('Agent status error:', error);
    return {
      status: 'error',
      error: error.message,
      lastHealthCheck: new Date().toISOString()
    };
  }
}

async function getAgentPerformance() {
  // Mock performance metrics
  return {
    totalTransactions: Math.floor(Math.random() * 1000) + 500,
    successRate: '98.5%',
    averageGasUsed: '45,000',
    totalValueDistributed: (Math.random() * 50 + 10).toFixed(6) + ' ETH',
    pendingTransactions: Math.floor(Math.random() * 5),
    avgProcessingTime: Math.floor(Math.random() * 30) + 15 + ' seconds',
    dailyVolume: (Math.random() * 5 + 1).toFixed(4) + ' ETH'
  };
}

async function getRecentTransactions(limit = 10) {
  // Mock recent transactions
  const transactions = [];
  
  for (let i = 0; i < limit; i++) {
    transactions.push({
      hash: `0x${Math.random().toString(16).substr(2, 64)}`,
      type: ['zone_capture_reward', 'milestone_bonus', 'streak_reward'][Math.floor(Math.random() * 3)],
      amount: (Math.random() * 0.1 + 0.01).toFixed(6) + ' ETH',
      recipient: `0x${Math.random().toString(16).substr(2, 40)}`,
      status: 'confirmed',
      timestamp: new Date(Date.now() - i * Math.random() * 3600000).toISOString(),
      gasUsed: Math.floor(Math.random() * 20000) + 21000
    });
  }
  
  return transactions;
}

async function logAgentTransaction(transactionData) {
  // In production, save to database
  console.log('Agent transaction logged:', {
    id: transactionData.rewardId,
    hash: transactionData.transactionHash,
    status: transactionData.status,
    amount: transactionData.amount,
    timestamp: transactionData.timestamp
  });
}

async function getTransactionByHash(hash) {
  // Mock transaction lookup
  return {
    hash,
    from: agentWallet.address,
    to: `0x${Math.random().toString(16).substr(2, 40)}`,
    value: ethers.parseEther((Math.random() * 0.1 + 0.01).toFixed(6)).toString(),
    gasUsed: 21000,
    status: 'confirmed',
    timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString()
  };
}

async function analyzeDispute(transaction, reason, evidence) {
  // Mock dispute analysis
  const analysis = {
    transactionValid: true,
    evidenceStrength: Math.random(),
    riskScore: Math.random(),
    autoResolvable: false,
    resolution: null
  };
  
  // Simple auto-resolution rules
  if (reason === 'accidental_payment' && analysis.evidenceStrength > 0.8) {
    analysis.autoResolvable = true;
    analysis.resolution = 'partial_refund';
  } else if (reason === 'insufficient_activity_data' && analysis.riskScore < 0.3) {
    analysis.autoResolvable = true;
    analysis.resolution = 'activity_revalidation';
  }
  
  return analysis;
}

async function resolveDispute(disputeId, resolution, resolvedBy) {
  console.log('Dispute resolved:', {
    disputeId,
    resolution,
    resolvedBy,
    timestamp: new Date().toISOString()
  });
  
  let action = 'no_action';
  
  switch (resolution) {
    case 'partial_refund':
      // Process refund
      action = 'refund_50_percent';
      break;
    case 'full_refund':
      action = 'refund_100_percent';
      break;
    case 'activity_revalidation':
      action = 'revalidate_and_adjust';
      break;
    default:
      action = 'dispute_dismissed';
  }
  
  return {
    disputeId,
    action,
    processedAt: new Date().toISOString(),
    resolvedBy
  };
}

async function queueManualReview(disputeId, disputeData) {
  // In production, add to review queue
  console.log('Dispute queued for manual review:', {
    disputeId,
    reason: disputeData.reason,
    queuedAt: disputeData.createdAt
  });
}

export async function processRefund(transactionHash, refundAmount, reason) {
  try {
    const refundId = `refund_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Get original transaction details
    const originalTx = await getTransactionByHash(transactionHash);
    
    // Calculate refund amount
    const refundWei = typeof refundAmount === 'string' ? 
      ethers.parseEther(refundAmount) : 
      BigInt(Math.floor(refundAmount * 1e18));
    
    // Process refund transaction
    const mockRefundHash = `0x${Math.random().toString(16).substr(2, 64)}`;
    
    console.log('Processing refund:', {
      refundId,
      originalHash: transactionHash,
      refundHash: mockRefundHash,
      amount: refundWei.toString(),
      reason
    });
    
    // Log refund transaction
    await logAgentTransaction({
      rewardId: refundId,
      transactionHash: mockRefundHash,
      type: 'refund',
      recipientId: 'dispute_resolution',
      recipientAddress: originalTx.from,
      amount: refundWei.toString(),
      status: 'confirmed',
      timestamp: new Date().toISOString(),
      metadata: { originalTransaction: transactionHash, reason }
    });
    
    return {
      refundId,
      transactionHash: mockRefundHash,
      status: 'processed',
      amount: refundWei.toString(),
      processedAt: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Refund processing error:', error);
    throw new Error(`Failed to process refund: ${error.message}`);
  }
}