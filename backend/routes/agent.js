import express from 'express';
import { getAgentStatus } from '../services/paymentAgent.js';

const router = express.Router();

// GET /api/agent/status - Payment/dispute agent status
router.get('/status', async (req, res) => {
  try {
    const agentStatus = await getAgentStatus();
    
    res.json({
      agent: {
        id: 'payment_agent_001',
        name: 'FitConquer Payment Agent',
        version: '1.0.0',
        status: agentStatus.status,
        uptime: agentStatus.uptime,
        lastHealthCheck: agentStatus.lastHealthCheck
      },
      wallet: {
        address: process.env.AGENT_WALLET_ADDRESS,
        balance: agentStatus.wallet.balance,
        balanceETH: agentStatus.wallet.balanceETH,
        networkId: agentStatus.wallet.networkId,
        gasPrice: agentStatus.wallet.gasPrice
      },
      performance: {
        totalTransactions: agentStatus.performance.totalTransactions,
        successRate: agentStatus.performance.successRate,
        averageGasUsed: agentStatus.performance.averageGasUsed,
        totalValueDistributed: agentStatus.performance.totalValueDistributed,
        pendingTransactions: agentStatus.performance.pendingTransactions
      },
      recent: agentStatus.recentTransactions || [],
      config: {
        maxRewardAmount: '0.1 ETH',
        autoDistributionEnabled: true,
        disputeTimeoutHours: 24,
        minConfirmations: 3
      }
    });
    
  } catch (error) {
    console.error('Agent status error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch agent status',
      details: error.message
    });
  }
});

// GET /api/agent/transactions - Recent agent transactions
router.get('/transactions', async (req, res) => {
  const { page = 1, limit = 20, status, type } = req.query;
  
  try {
    // Mock transaction data
    const transactions = [
      {
        id: 'tx_001',
        hash: '0x1234567890abcdef1234567890abcdef12345678',
        type: 'zone_capture_reward',
        amount: '0.05',
        recipient: 'user_123',
        status: 'confirmed',
        confirmations: 12,
        gasUsed: 21000,
        gasPrice: '20000000000',
        timestamp: '2024-01-15T10:30:00Z',
        blockNumber: 45234567,
        metadata: {
          zoneId: '891fb466d23ffff',
          activityId: 'act_456'
        }
      },
      {
        id: 'tx_002',
        hash: '0xabcdef1234567890abcdef1234567890abcdef12',
        type: 'milestone_bonus',
        amount: '0.025',
        recipient: 'user_456',
        status: 'pending',
        confirmations: 1,
        gasUsed: null,
        gasPrice: '22000000000',
        timestamp: '2024-01-15T14:15:00Z',
        blockNumber: null,
        metadata: {
          milestone: '100km_total'
        }
      }
    ];
    
    // Apply filters
    let filtered = transactions;
    if (status) {
      filtered = filtered.filter(tx => tx.status === status);
    }
    if (type) {
      filtered = filtered.filter(tx => tx.type === type);
    }
    
    // Pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedTx = filtered.slice(startIndex, endIndex);
    
    res.json({
      transactions: paginatedTx,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filtered.length,
        pages: Math.ceil(filtered.length / parseInt(limit))
      },
      summary: {
        totalTransactions: transactions.length,
        confirmedTransactions: transactions.filter(tx => tx.status === 'confirmed').length,
        pendingTransactions: transactions.filter(tx => tx.status === 'pending').length,
        failedTransactions: transactions.filter(tx => tx.status === 'failed').length,
        totalValueDistributed: transactions
          .filter(tx => tx.status === 'confirmed')
          .reduce((sum, tx) => sum + parseFloat(tx.amount), 0)
          .toFixed(6) + ' ETH'
      }
    });
    
  } catch (error) {
    console.error('Agent transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// POST /api/agent/config - Update agent configuration
router.post('/config', async (req, res) => {
  const { autoDistributionEnabled, maxRewardAmount, disputeTimeoutHours } = req.body;
  
  try {
    // Validate configuration
    if (maxRewardAmount && parseFloat(maxRewardAmount) > 1.0) {
      return res.status(400).json({ 
        error: 'Max reward amount cannot exceed 1.0 ETH' 
      });
    }
    
    if (disputeTimeoutHours && (disputeTimeoutHours < 1 || disputeTimeoutHours > 168)) {
      return res.status(400).json({ 
        error: 'Dispute timeout must be between 1 and 168 hours' 
      });
    }
    
    // Update configuration (mock)
    const updatedConfig = {
      autoDistributionEnabled: autoDistributionEnabled ?? true,
      maxRewardAmount: maxRewardAmount ?? '0.1',
      disputeTimeoutHours: disputeTimeoutHours ?? 24,
      updatedAt: new Date().toISOString(),
      updatedBy: req.user.id
    };
    
    res.json({
      success: true,
      config: updatedConfig,
      message: 'Agent configuration updated successfully'
    });
    
  } catch (error) {
    console.error('Agent config error:', error);
    res.status(500).json({ 
      error: 'Failed to update agent configuration',
      details: error.message
    });
  }
});

// POST /api/agent/dispute - Report or resolve dispute
router.post('/dispute', async (req, res) => {
  const { type, transactionHash, reason, evidence } = req.body;
  
  if (!type || !['report', 'resolve'].includes(type)) {
    return res.status(400).json({ 
      error: 'Invalid dispute type. Must be "report" or "resolve"' 
    });
  }
  
  try {
    if (type === 'report') {
      // Report a new dispute
      const dispute = {
        id: `dispute_${Date.now()}`,
        transactionHash,
        reportedBy: req.user.id,
        reason,
        evidence,
        status: 'open',
        createdAt: new Date().toISOString()
      };
      
      // In production, save to database and notify agents
      console.log('New dispute reported:', dispute);
      
      res.json({
        success: true,
        dispute,
        message: 'Dispute reported successfully'
      });
      
    } else {
      // Resolve existing dispute
      const resolution = {
        disputeId: req.body.disputeId,
        resolution: req.body.resolution,
        resolvedBy: req.user.id,
        resolvedAt: new Date().toISOString(),
        refundAmount: req.body.refundAmount || null
      };
      
      res.json({
        success: true,
        resolution,
        message: 'Dispute resolved successfully'
      });
    }
    
  } catch (error) {
    console.error('Dispute error:', error);
    res.status(500).json({ 
      error: 'Failed to process dispute',
      details: error.message
    });
  }
});

export default router;