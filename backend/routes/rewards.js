import express from "express";
import { distributeReward } from "../services/paymentAgent.js";

const router = express.Router();

// POST /api/rewards/distribute - Trigger micropayment reward
router.post("/distribute", async (req, res) => {
  const { type, recipientId, amount, activityId, zoneId, reason } = req.body;

  if (!type || !recipientId || !amount) {
    return res.status(400).json({
      error: "Missing required fields: type, recipientId, amount",
    });
  }

  try {
    // Validate reward criteria
    const validation = await validateRewardCriteria({
      type,
      recipientId,
      amount,
      activityId,
      zoneId,
      requesterId: req.user.id,
    });

    if (!validation.valid) {
      return res.status(400).json({
        error: "Reward validation failed",
        details: validation.reason,
      });
    }

    // Execute payment via agent
    const paymentResult = await distributeReward({
      type,
      recipientId,
      amount: parseFloat(amount),
      metadata: {
        activityId,
        zoneId,
        reason,
        triggeredBy: req.user.id,
        timestamp: new Date().toISOString(),
      },
    });

    // Record reward in database
    await recordReward({
      id: paymentResult.rewardId,
      type,
      recipientId,
      amount: parseFloat(amount),
      transactionHash: paymentResult.transactionHash,
      status: "completed",
      activityId,
      zoneId,
      triggeredBy: req.user.id,
      createdAt: new Date(),
    });

    res.json({
      success: true,
      reward: {
        id: paymentResult.rewardId,
        type,
        amount: parseFloat(amount),
        recipient: recipientId,
        transactionHash: paymentResult.transactionHash,
        status: "completed",
        estimatedValue: `$${(parseFloat(amount) * 0.0002).toFixed(4)}`, // Mock conversion
        distributedAt: new Date().toISOString(),
      },
      message: "Reward distributed successfully",
    });
  } catch (error) {
    console.error("Reward distribution error:", error);

    // Record failed reward attempt
    await recordReward({
      type,
      recipientId,
      amount: parseFloat(amount),
      status: "failed",
      errorMessage: error.message,
      activityId,
      zoneId,
      triggeredBy: req.user.id,
      createdAt: new Date(),
    });

    res.status(500).json({
      error: "Failed to distribute reward",
      details: error.message,
    });
  }
});

// GET /api/rewards/history - Return user's past rewards
router.get("/history", async (req, res) => {
  const { page = 1, limit = 20, type, status } = req.query;

  try {
    // Mock reward history - in production, fetch from database
    const allRewards = [
      {
        id: "reward_123",
        type: "zone_capture",
        amount: 50000000000000000, // wei
        amountETH: "0.05",
        estimatedUSD: "$0.1250",
        recipient: req.user.id,
        transactionHash: "0x1234567890abcdef1234567890abcdef12345678",
        status: "completed",
        activityId: "act_456",
        zoneId: "891fb466d23ffff",
        reason: "Zone capture reward",
        distributedAt: "2024-01-15T10:30:00Z",
        blockNumber: 45234567,
      },
      {
        id: "reward_124",
        type: "milestone_bonus",
        amount: 25000000000000000,
        amountETH: "0.025",
        estimatedUSD: "$0.0625",
        recipient: req.user.id,
        transactionHash: "0xabcdef1234567890abcdef1234567890abcdef12",
        status: "completed",
        activityId: "act_457",
        reason: "100km milestone bonus",
        distributedAt: "2024-01-14T18:15:00Z",
        blockNumber: 45234501,
      },
      {
        id: "reward_125",
        type: "streak_bonus",
        amount: 10000000000000000,
        amountETH: "0.01",
        estimatedUSD: "$0.0250",
        recipient: req.user.id,
        transactionHash: "0xdef1234567890abcdef1234567890abcdef123456",
        status: "pending",
        reason: "7-day running streak",
        distributedAt: "2024-01-16T07:45:00Z",
        blockNumber: null,
      },
    ];

    // Apply filters
    let filteredRewards = allRewards;
    if (type) {
      filteredRewards = filteredRewards.filter((r) => r.type === type);
    }
    if (status) {
      filteredRewards = filteredRewards.filter((r) => r.status === status);
    }

    // Pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedRewards = filteredRewards.slice(startIndex, endIndex);

    // Calculate totals
    const completedRewards = filteredRewards.filter(
      (r) => r.status === "completed"
    );
    const totalEarned = completedRewards.reduce(
      (sum, r) => sum + parseFloat(r.amountETH),
      0
    );
    const totalUSD = completedRewards.length * 0.075; // Mock calculation

    res.json({
      rewards: paginatedRewards,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredRewards.length,
        pages: Math.ceil(filteredRewards.length / parseInt(limit)),
      },
      summary: {
        totalRewards: filteredRewards.length,
        completedRewards: completedRewards.length,
        pendingRewards: filteredRewards.filter((r) => r.status === "pending")
          .length,
        failedRewards: filteredRewards.filter((r) => r.status === "failed")
          .length,
        totalEarnedETH: totalEarned.toFixed(6),
        estimatedTotalUSD: `$${totalUSD.toFixed(4)}`,
      },
    });
  } catch (error) {
    console.error("Reward history error:", error);
    res.status(500).json({
      error: "Failed to fetch reward history",
      details: error.message,
    });
  }
});

// GET /api/rewards/pending - Get pending reward distributions
router.get("/pending", async (req, res) => {
  try {
    // Mock pending rewards
    const pendingRewards = [
      {
        id: "reward_pending_1",
        type: "zone_defense",
        amount: 30000000000000000,
        recipient: req.user.id,
        reason: "Successfully defended zone for 24h",
        zoneId: "891fb466d23ffff",
        createdAt: "2024-01-16T12:00:00Z",
        estimatedDistribution: "2024-01-16T18:00:00Z",
      },
    ];

    res.json({
      pendingRewards,
      totalPending: pendingRewards.length,
      estimatedValue: `$${(
        pendingRewards.reduce((sum, r) => sum + r.amount, 0) * 0.0000002
      ).toFixed(4)}`,
    });
  } catch (error) {
    console.error("Pending rewards error:", error);
    res.status(500).json({ error: "Failed to fetch pending rewards" });
  }
});

// POST /api/rewards/claim - Manually claim pending rewards
router.post("/claim", async (req, res) => {
  const { rewardIds } = req.body;

  if (!rewardIds || !Array.isArray(rewardIds)) {
    return res.status(400).json({ error: "rewardIds array required" });
  }

  try {
    const claimResults = [];

    for (const rewardId of rewardIds) {
      try {
        const claimResult = await distributeReward({
          type: "manual_claim",
          rewardId,
          recipientId: req.user.id,
        });

        claimResults.push({
          rewardId,
          success: true,
          transactionHash: claimResult.transactionHash,
        });
      } catch (error) {
        claimResults.push({
          rewardId,
          success: false,
          error: error.message,
        });
      }
    }

    const successCount = claimResults.filter((r) => r.success).length;

    res.json({
      claimed: successCount,
      failed: claimResults.length - successCount,
      results: claimResults,
      message: `${successCount} rewards claimed successfully`,
    });
  } catch (error) {
    console.error("Reward claim error:", error);
    res.status(500).json({
      error: "Failed to claim rewards",
      details: error.message,
    });
  }
});

// Helper functions
async function validateRewardCriteria(criteria) {
  // Mock validation - in production, implement proper validation logic
  if (criteria.amount > 1000000000000000000) {
    // 1 ETH
    return { valid: false, reason: "Amount exceeds maximum reward limit" };
  }

  return { valid: true };
}

async function recordReward(rewardData) {
  // Mock database recording
  console.log("Reward recorded:", rewardData);
}

export default router;
