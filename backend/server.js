import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Import routes
import authRoutes from './routes/auth.js';
import activityRoutes from './routes/activities.js';
import zoneRoutes from './routes/zones.js';
import leaderboardRoutes from './routes/leaderboard.js';

dotenv.config();

const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fitconquer');

mongoose.connection.on('connected', () => {
  console.log('✅ Connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:5500', 
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5500',
    'http://127.0.0.1:3000',
    'https://runft.vercel.app'
  ],
  credentials: true
}));

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'FitConquer Backend',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/zones', zoneRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

// Simple user profile endpoint
app.get('/api/me', (req, res) => {
  res.json({
    id: 'demo_user',
    name: 'Demo Runner',
    totalActivities: 15,
    totalPoints: 1250,
    zonesOwned: 3,
    walletConnected: false
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 FitConquer API server running on port ${PORT}`);
  console.log(`📊 Health check available at http://localhost:${PORT}/health`);
});