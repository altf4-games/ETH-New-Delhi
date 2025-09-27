import express from "express";
import { computePoints } from "../services/pointsEngine.js";

const router = express.Router();

// GET /api/points/:activityId - Return computed points for an activity
router.get("/:activityId", async (req, res) => {
  const { activityId } = req.params;

  try {
    // In production, fetch activity from database
    // For demo, using mock data
    const mockActivityData = {
      distance: 5200, // meters
      duration: 1980, // seconds
      elevationGain: 45,
      averageHeartrate: 155,
      streams: {
        latlng: [
          [40.7829, -73.9654],
          [40.7831, -73.9652],
        ], // simplified
        altitude: [10, 12, 15, 11, 9],
        time: [0, 30, 60, 90, 120],
        heartrate: [145, 150, 155, 158, 152],
      },
    };

    const pointsBreakdown = computePoints(mockActivityData.streams, {
      distance: mockActivityData.distance / 1000, // convert to km
      duration: mockActivityData.duration,
      elevationGain: mockActivityData.elevationGain,
      averageHeartrate: mockActivityData.averageHeartrate,
    });

    res.json({
      activityId,
      points: pointsBreakdown,
      formula: {
        base: "1 point per km + 1 point per 6 minutes + 1 point per 10m elevation",
        pace: "5 bonus points for sub-5min/km pace, 3 points for sub-6min/km",
        heartrate: "Bonus for sustained effort in target HR zones",
        consistency: "Penalty for GPS anomalies or impossible speeds",
      },
      metadata: {
        computedAt: new Date().toISOString(),
        version: "1.0.0",
      },
    });
  } catch (error) {
    console.error("Points calculation error:", error);
    res.status(500).json({
      error: "Failed to calculate points",
      details: error.message,
    });
  }
});

// POST /api/points/calculate - Calculate points for custom activity data
router.post("/calculate", async (req, res) => {
  const { streams, metadata } = req.body;

  if (!streams || !streams.latlng || !streams.time) {
    return res.status(400).json({
      error: "Missing required streams data (latlng, time)",
    });
  }

  try {
    const pointsBreakdown = computePoints(streams, metadata);

    res.json({
      points: pointsBreakdown,
      breakdown: {
        distance: pointsBreakdown.distanceKm,
        duration: pointsBreakdown.durationSec,
        elevation: pointsBreakdown.elevationGain,
        basePoints: pointsBreakdown.basePoints,
        bonuses: pointsBreakdown.bonuses,
        penalties: pointsBreakdown.penalties,
        finalScore: pointsBreakdown.totalPoints,
      },
    });
  } catch (error) {
    console.error("Points calculation error:", error);
    res.status(400).json({
      error: "Invalid activity data",
      details: error.message,
    });
  }
});

// GET /api/points/leaderboard - Top point earners
router.get("/leaderboard/top", async (req, res) => {
  const { period = "week", limit = 10 } = req.query;

  try {
    // Mock leaderboard data
    const leaderboard = [
      {
        userId: "user_1",
        username: "speedrunner_pro",
        totalPoints: 2450,
        activities: 12,
      },
      {
        userId: "user_2",
        username: "trail_master",
        totalPoints: 2180,
        activities: 8,
      },
      {
        userId: "user_3",
        username: "city_explorer",
        totalPoints: 1950,
        activities: 15,
      },
      {
        userId: "user_4",
        username: "marathon_maniac",
        totalPoints: 1820,
        activities: 6,
      },
      {
        userId: "user_5",
        username: "hill_climber",
        totalPoints: 1650,
        activities: 9,
      },
    ];

    res.json({
      period,
      leaderboard: leaderboard.slice(0, parseInt(limit)),
      userRank: 3, // current user's rank
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Leaderboard error:", error);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

export default router;
