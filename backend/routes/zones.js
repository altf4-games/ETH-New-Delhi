import express from "express";
import { Zone, User } from "../models/index.js";
import { ethers } from "ethers";

const router = express.Router();

// POST /api/zones/capture - Capture a zone (mint NFT via MetaMask)
router.post("/capture", async (req, res) => {
  const { h3Index, captureScore, walletAddress, transactionHash } = req.body;

  if (!h3Index || !captureScore || !walletAddress) {
    return res.status(400).json({
      error: "Missing required fields: h3Index, captureScore, walletAddress",
    });
  }

  try {
    // Check if zone already exists
    let zone = await Zone.findOne({ h3Index });
    let isNewCapture = false;

    if (!zone) {
      // New zone
      zone = new Zone({
        h3Index,
        captureScore,
        tokenId: Math.floor(Math.random() * 10000) + 1, // Mock token ID
      });
      isNewCapture = true;
    } else {
      // Check if current power allows capture
      const daysPassed = (Date.now() - zone.capturedAt) / (1000 * 60 * 60 * 24);
      const currentPower = Math.max(
        0,
        zone.captureScore - Math.floor(daysPassed)
      );

      if (captureScore <= currentPower) {
        return res.status(400).json({
          error: "Insufficient score to capture zone",
          required: currentPower + 1,
          provided: captureScore,
        });
      }

      zone.captureScore = captureScore;
      zone.capturedAt = new Date();
      zone.totalCaptures += 1;
    }

    // Find or create user
    let user = await User.findOne({
      walletAddress: walletAddress.toLowerCase(),
    });
    if (!user) {
      user = new User({
        walletAddress: walletAddress.toLowerCase(),
        name: "Runner " + walletAddress.slice(-4),
      });
      await user.save();
    }

    zone.owner = user._id;
    await zone.save();

    // Update user stats
    if (isNewCapture) {
      user.zonesOwned += 1;
      await user.save();
    }

    res.json({
      success: true,
      message: isNewCapture ? "Zone captured!" : "Zone recaptured!",
      zone: {
        h3Index: zone.h3Index,
        captureScore: zone.captureScore,
        tokenId: zone.tokenId,
        owner: walletAddress,
        capturedAt: zone.capturedAt,
      },
      transactionHash,
    });
  } catch (error) {
    console.error("Zone capture error:", error);
    res.status(500).json({
      error: "Failed to capture zone",
      details: error.message,
    });
  }
});

// GET /api/zones/:h3Index - Get zone info
router.get("/:h3Index", async (req, res) => {
  const { h3Index } = req.params;

  try {
    const zone = await Zone.findOne({ h3Index }).populate(
      "owner",
      "walletAddress name"
    );

    if (!zone) {
      return res.json({
        exists: false,
        h3Index,
        canCapture: true,
        minimumScore: parseInt(process.env.MIN_ACTIVITY_POINTS) || 10,
      });
    }

    // Calculate current power with decay
    const daysPassed = (Date.now() - zone.capturedAt) / (1000 * 60 * 60 * 24);
    const currentPower = Math.max(
      0,
      zone.captureScore - Math.floor(daysPassed)
    );

    res.json({
      exists: true,
      h3Index: zone.h3Index,
      tokenId: zone.tokenId,
      owner: {
        address: zone.owner?.walletAddress,
        name: zone.owner?.name,
      },
      captureScore: zone.captureScore,
      currentPower,
      capturedAt: zone.capturedAt,
      totalCaptures: zone.totalCaptures,
      canCapture: true,
      minimumScore: currentPower + 1,
    });
  } catch (error) {
    console.error("Zone fetch error:", error);
    res.status(500).json({ error: "Failed to fetch zone" });
  }
});

// GET /api/zones - Get zones (owned by user or nearby)
router.get("/", async (req, res) => {
  const { walletAddress, limit = 10 } = req.query;

  try {
    if (walletAddress) {
      // Get user's zones
      const user = await User.findOne({
        walletAddress: walletAddress.toLowerCase(),
      });
      if (!user) {
        return res.json({ zones: [] });
      }

      const zones = await Zone.find({ owner: user._id })
        .populate("owner", "walletAddress name")
        .limit(parseInt(limit));

      res.json({
        zones: zones.map((zone) => {
          const daysPassed =
            (Date.now() - zone.capturedAt) / (1000 * 60 * 60 * 24);
          const currentPower = Math.max(
            0,
            zone.captureScore - Math.floor(daysPassed)
          );

          return {
            h3Index: zone.h3Index,
            tokenId: zone.tokenId,
            captureScore: zone.captureScore,
            currentPower,
            capturedAt: zone.capturedAt,
            totalCaptures: zone.totalCaptures,
          };
        }),
      });
    } else {
      // Get recent zones
      const zones = await Zone.find()
        .populate("owner", "walletAddress name")
        .sort({ capturedAt: -1 })
        .limit(parseInt(limit));

      res.json({
        zones: zones.map((zone) => ({
          h3Index: zone.h3Index,
          tokenId: zone.tokenId,
          owner: zone.owner?.name || "Unknown",
          captureScore: zone.captureScore,
          capturedAt: zone.capturedAt,
          totalCaptures: zone.totalCaptures,
        })),
      });
    }
  } catch (error) {
    console.error("Zones query error:", error);
    res.status(500).json({ error: "Failed to fetch zones" });
  }
});

export default router;
