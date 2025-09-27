import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  stravaId: {
    type: String,
    sparse: true
  },
  name: String,
  totalPoints: {
    type: Number,
    default: 0
  },
  totalActivities: {
    type: Number,
    default: 0
  },
  zonesOwned: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const activitySchema = new mongoose.Schema({
  stravaId: { type: Number, required: true, unique: true },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: { type: String, required: true },
  type: { type: String, required: true }, // Run, Ride, Hike, etc.
  distance: { type: Number, default: 0 }, // in meters
  movingTime: { type: Number, default: 0 }, // in seconds
  elapsedTime: { type: Number, default: 0 }, // in seconds
  totalElevationGain: { type: Number, default: 0 }, // in meters
  startDate: { type: Date, required: true },
  startDateLocal: { type: Date, required: true },
  startLatLng: [Number], // [lat, lng]
  endLatLng: [Number], // [lat, lng]
  polyline: String, // Encoded polyline from Strava
  points: { type: Number, default: 0 }, // Calculated FitConquer points
  h3Zones: [String], // Array of H3 zone indices
  averageSpeed: { type: Number, default: 0 }, // m/s
  maxSpeed: { type: Number, default: 0 }, // m/s
  averageHeartrate: Number, // BPM
  maxHeartrate: Number, // BPM
  averageWatts: Number, // Watts
  kilojoules: Number, // Total energy
  trainer: { type: Boolean, default: false },
  commute: { type: Boolean, default: false },
  flagged: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const zoneSchema = new mongoose.Schema({
  h3Index: {
    type: String,
    required: true,
    unique: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  captureScore: {
    type: Number,
    default: 0
  },
  capturedAt: {
    type: Date,
    default: Date.now
  },
  tokenId: Number,
  totalCaptures: {
    type: Number,
    default: 1
  }
});

export const User = mongoose.model('User', userSchema);
export const Activity = mongoose.model('Activity', activitySchema);
export const Zone = mongoose.model('Zone', zoneSchema);