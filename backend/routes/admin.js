import express from 'express';

const router = express.Router();

// Admin middleware (simplified for demo)
const adminMiddleware = (req, res, next) => {
  // In production, check if user has admin privileges
  if (req.user.id !== 'demo_user_123' && !req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

router.use(adminMiddleware);

// GET /api/admin/flags - List flagged activities
router.get('/flags', async (req, res) => {
  const { status = 'all', page = 1, limit = 20, sortBy = 'createdAt' } = req.query;
  
  try {
    // Mock flagged activities - in production, fetch from database
    const flaggedActivities = [
      {
        id: 'flag_001',
        activityId: 'act_suspicious_123',
        athleteId: 'athlete_456',
        username: 'suspicious_runner',
        flagType: 'impossible_speed',
        severity: 'high',
        details: {
          maxSpeed: 15.2, // m/s
          threshold: 12.0,
          location: 'Central Park segment',
          timestamp: '2024-01-15T14:23:45Z'
        },
        status: 'pending_review',
        createdAt: '2024-01-15T14:25:00Z',
        reviewedBy: null,
        reviewedAt: null,
        action: null
      },
      {
        id: 'flag_002',
        activityId: 'act_gps_jump_789',
        athleteId: 'athlete_789',
        username: 'teleport_runner',
        flagType: 'gps_inconsistent',
        severity: 'medium',
        details: {
          gpsJumps: 5,
          maxJumpDistance: 2400, // meters
          threshold: 3,
          affectedSegments: ['segment_1', 'segment_3', 'segment_7']
        },
        status: 'under_review',
        createdAt: '2024-01-14T09:15:00Z',
        reviewedBy: 'admin_user_001',
        reviewedAt: '2024-01-15T10:30:00Z',
        action: null
      },
      {
        id: 'flag_003',
        activityId: 'act_duplicate_101',
        athleteId: 'athlete_101',
        username: 'copy_paste_runner',
        flagType: 'duplicate_activity',
        severity: 'low',
        details: {
          originalActivityId: 'act_original_098',
          similarity: 0.98,
          timeOffset: 86400 // seconds
        },
        status: 'resolved',
        createdAt: '2024-01-13T16:45:00Z',
        reviewedBy: 'admin_user_002',
        reviewedAt: '2024-01-14T11:20:00Z',
        action: 'activity_hidden'
      }
    ];
    
    // Apply status filter
    let filtered = flaggedActivities;
    if (status !== 'all') {
      filtered = filtered.filter(flag => flag.status === status);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'severity') {
        const severityOrder = { high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    // Pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedFlags = filtered.slice(startIndex, endIndex);
    
    // Statistics
    const stats = {
      total: flaggedActivities.length,
      pending: flaggedActivities.filter(f => f.status === 'pending_review').length,
      underReview: flaggedActivities.filter(f => f.status === 'under_review').length,
      resolved: flaggedActivities.filter(f => f.status === 'resolved').length,
      severity: {
        high: flaggedActivities.filter(f => f.severity === 'high').length,
        medium: flaggedActivities.filter(f => f.severity === 'medium').length,
        low: flaggedActivities.filter(f => f.severity === 'low').length
      },
      flagTypes: {
        impossible_speed: flaggedActivities.filter(f => f.flagType === 'impossible_speed').length,
        gps_inconsistent: flaggedActivities.filter(f => f.flagType === 'gps_inconsistent').length,
        duplicate_activity: flaggedActivities.filter(f => f.flagType === 'duplicate_activity').length,
        heart_rate_anomaly: flaggedActivities.filter(f => f.flagType === 'heart_rate_anomaly').length
      }
    };
    
    res.json({
      flags: paginatedFlags,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filtered.length,
        pages: Math.ceil(filtered.length / parseInt(limit))
      },
      statistics: stats,
      filters: { status, sortBy }
    });
    
  } catch (error) {
    console.error('Admin flags error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch flagged activities',
      details: error.message
    });
  }
});

// POST /api/admin/flags/:id/review - Review and take action on a flag
router.post('/flags/:id/review', async (req, res) => {
  const flagId = req.params.id;
  const { action, notes } = req.body;
  
  const validActions = ['dismiss', 'hide_activity', 'ban_user', 'request_verification'];
  
  if (!action || !validActions.includes(action)) {
    return res.status(400).json({ 
      error: 'Invalid action',
      validActions
    });
  }
  
  try {
    // Update flag status
    const updatedFlag = {
      id: flagId,
      status: 'resolved',
      action,
      reviewedBy: req.user.id,
      reviewedAt: new Date().toISOString(),
      reviewNotes: notes || null
    };
    
    // Execute the action
    let actionResult = {};
    switch (action) {
      case 'dismiss':
        actionResult = { message: 'Flag dismissed as false positive' };
        break;
      case 'hide_activity':
        actionResult = await hideActivity(flagId);
        break;
      case 'ban_user':
        actionResult = await banUser(flagId);
        break;
      case 'request_verification':
        actionResult = await requestVerification(flagId);
        break;
    }
    
    res.json({
      success: true,
      flag: updatedFlag,
      actionResult,
      message: `Flag ${flagId} reviewed and ${action} applied`
    });
    
  } catch (error) {
    console.error('Flag review error:', error);
    res.status(500).json({ 
      error: 'Failed to review flag',
      details: error.message
    });
  }
});

// GET /api/admin/stats - Get admin dashboard statistics
router.get('/stats', async (req, res) => {
  const { period = 'week' } = req.query;
  
  try {
    // Mock admin statistics
    const stats = {
      activities: {
        total: 15432,
        processed: 15398,
        flagged: 34,
        flagRate: '0.22%'
      },
      users: {
        total: 2847,
        active: 1923,
        banned: 5,
        newThisWeek: 127
      },
      zones: {
        total: 8934,
        captured: 7821,
        contested: 234,
        unclaimed: 1113
      },
      rewards: {
        distributed: 1247,
        totalValue: '15.234 ETH',
        pending: 23,
        failed: 2
      },
      antiCheat: {
        totalScanned: 15432,
        flaggedCount: 34,
        falsePositives: 8,
        accuracy: '97.6%',
        topFlags: [
          { type: 'impossible_speed', count: 12 },
          { type: 'gps_inconsistent', count: 8 },
          { type: 'duplicate_activity', count: 6 },
          { type: 'heart_rate_anomaly', count: 4 },
          { type: 'device_tampering', count: 4 }
        ]
      }
    };
    
    res.json({
      period,
      statistics: stats,
      generatedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Failed to fetch admin statistics' });
  }
});

// GET /api/admin/users - List users with admin actions
router.get('/users', async (req, res) => {
  const { status = 'all', search, page = 1, limit = 20 } = req.query;
  
  try {
    // Mock user data
    const users = [
      {
        id: 'user_123',
        username: 'speedrunner_pro',
        email: 'alex@example.com',
        name: 'Alex Chen',
        status: 'active',
        joinedAt: '2023-12-01T10:00:00Z',
        lastActive: '2024-01-15T14:30:00Z',
        stats: {
          activities: 67,
          totalDistance: 423.2,
          zonesOwned: 12,
          flags: 0
        }
      },
      {
        id: 'user_456',
        username: 'suspicious_runner',
        email: 'suspicious@example.com',
        name: 'John Doe',
        status: 'flagged',
        joinedAt: '2024-01-10T15:30:00Z',
        lastActive: '2024-01-15T16:45:00Z',
        stats: {
          activities: 8,
          totalDistance: 89.7,
          zonesOwned: 2,
          flags: 3
        }
      }
    ];
    
    // Apply filters and search
    let filteredUsers = users;
    if (status !== 'all') {
      filteredUsers = filteredUsers.filter(user => user.status === status);
    }
    if (search) {
      const searchLower = search.toLowerCase();
      filteredUsers = filteredUsers.filter(user => 
        user.username.toLowerCase().includes(searchLower) ||
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
      );
    }
    
    // Pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
    
    res.json({
      users: paginatedUsers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredUsers.length,
        pages: Math.ceil(filteredUsers.length / parseInt(limit))
      }
    });
    
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Helper functions (mock implementations)
async function hideActivity(flagId) {
  console.log(`Hiding activity for flag ${flagId}`);
  return { message: 'Activity hidden from public view' };
}

async function banUser(flagId) {
  console.log(`Banning user for flag ${flagId}`);
  return { message: 'User banned for 7 days' };
}

async function requestVerification(flagId) {
  console.log(`Requesting verification for flag ${flagId}`);
  return { message: 'Verification request sent to user' };
}

export default router;