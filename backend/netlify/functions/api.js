import express from "express";
import serverless from "serverless-http";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

// Import routes
import authRoutes from "../../routes/auth.js";
import activityRoutes from "../../routes/activities.js";
import zoneRoutes from "../../routes/zones.js";
import leaderboardRoutes from "../../routes/leaderboard.js";

dotenv.config();

const app = express();

// MongoDB Connection with caching for serverless
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    cachedDb = mongoose.connection;
    console.log("✅ Connected to MongoDB");
    return cachedDb;
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    throw err;
  }
}

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5500",
      "http://localhost:3000",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:5500",
      "http://127.0.0.1:3000",
      "https://runft.vercel.app",
      process.env.FRONTEND_URL,
    ].filter(Boolean),
    credentials: true,
  })
);

app.use(express.json());

// Connect to DB before handling requests
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    res.status(500).json({ error: "Database connection failed" });
  }
});

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// API Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    service: "FitConquer Backend",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/zones", zoneRoutes);
app.use("/api/leaderboard", leaderboardRoutes);

// Simple user profile endpoint
app.get("/api/me", (req, res) => {
  res.json({
    id: "demo_user",
    name: "Demo Runner",
    totalActivities: 15,
    totalPoints: 1250,
    zonesOwned: 3,
    walletConnected: false,
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Export the serverless function
export const handler = serverless(app);
