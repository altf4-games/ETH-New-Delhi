import express from "express";
import { User } from "../models/index.js";

const router = express.Router();

// GET /api/leaderboard - Simple leaderboard
router.get("/", async (req, res) => {
  const { period = "alltime", limit = 10 } = req.query;

  try {
    // Get top users by points
    const users = await User.find()
      .sort({ totalPoints: -1 })
      .limit(parseInt(limit))
      .select("walletAddress name totalPoints totalActivities zonesOwned");

    const leaderboard = users.map((user, index) => ({
      rank: index + 1,
      name: user.name,
      walletAddress:
        user.walletAddress.slice(0, 6) + "..." + user.walletAddress.slice(-4),
      totalPoints: user.totalPoints,
      totalActivities: user.totalActivities,
      zonesOwned: user.zonesOwned,
    }));

    res.json({
      period,
      leaderboard,
      total: users.length,
    });
  } catch (error) {
    console.error("Leaderboard error:", error);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

export default router;
