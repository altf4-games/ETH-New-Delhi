import express from 'express';
import axios from 'axios';
import { User } from '../models/index.js';

const router = express.Router();

// GET /api/auth/strava - Redirect to Strava OAuth
router.get('/strava', (req, res) => {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const redirectUri = `${process.env.BASE_URL}/api/auth/strava/callback`;
  const scope = 'activity:read_all,read';
  
  const authUrl = `https://www.strava.com/oauth/authorize?` +
    `client_id=${clientId}&` +
    `response_type=code&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `scope=${scope}`;
  
  res.redirect(authUrl);
});

// GET /api/auth/strava/callback - Exchange code for tokens
router.get('/strava/callback', async (req, res) => {
  const { code, error } = req.query;
  
  if (error) {
    return res.status(400).json({ error: 'OAuth denied', details: error });
  }
  
  if (!code) {
    return res.status(400).json({ error: 'Missing authorization code' });
  }
  
  try {
    // Exchange code for tokens
    const tokenResponse = await axios.post('https://www.strava.com/oauth/token', {
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code'
    });
    
    const { access_token, refresh_token, expires_at, expires_in, athlete } = tokenResponse.data;
    
    // Return HTML page that communicates with parent window
    const athleteData = {
      success: true,
      message: 'Connected to Strava successfully!',
      athlete: {
        id: athlete.id,
        name: `${athlete.firstname} ${athlete.lastname}`,
        username: athlete.username,
        profile_picture: athlete.profile
      },
      access_token: access_token,
      refresh_token: refresh_token,
      expires_at: expires_at,
      expires_in: expires_in,
      nextStep: 'Connect your MetaMask wallet to start capturing zones!'
    };

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Strava Authentication Success</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            text-align: center; 
            padding: 50px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }
          .success-box {
            background: white;
            color: #333;
            padding: 30px;
            border-radius: 10px;
            max-width: 400px;
            margin: 0 auto;
          }
        </style>
      </head>
      <body>
        <div class="success-box">
          <h2>🎉 Strava Connected!</h2>
          <p>Welcome, ${athleteData.athlete.name}!</p>
          <p>You can close this tab and return to the main page.</p>
          <button onclick="window.close()">Close Tab</button>
        </div>
        <script>
          // Send data back to parent window
          try {
            if (window.opener) {
              window.opener.postMessage(${JSON.stringify(athleteData)}, '*');
              setTimeout(() => window.close(), 2000);
            } else if (window.parent) {
              window.parent.postMessage(${JSON.stringify(athleteData)}, '*');
            }
          } catch (error) {
            console.log('Could not communicate with parent window:', error);
          }
        </script>
      </body>
      </html>
    `);
    
  } catch (error) {
    console.error('Strava OAuth error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to authenticate with Strava',
      details: error.response?.data?.message || error.message
    });
  }
});

// POST /api/auth/strava/refresh - Refresh Strava access token
router.post('/strava/refresh', async (req, res) => {
  const { refresh_token } = req.body;
  
  if (!refresh_token) {
    return res.status(400).json({ error: 'Refresh token required' });
  }
  
  try {
    const tokenResponse = await axios.post('https://www.strava.com/oauth/token', {
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      refresh_token: refresh_token,
      grant_type: 'refresh_token'
    });
    
    const { access_token, refresh_token: new_refresh_token, expires_at, expires_in } = tokenResponse.data;
    
    res.json({
      success: true,
      access_token,
      refresh_token: new_refresh_token,
      expires_at,
      expires_in
    });
    
  } catch (error) {
    console.error('Token refresh error:', error.response?.data || error.message);
    res.status(401).json({ 
      error: 'Failed to refresh token',
      details: error.response?.data?.message || error.message
    });
  }
});

// POST /api/auth/wallet - Connect MetaMask wallet
router.post('/wallet', async (req, res) => {
  const { walletAddress, signature } = req.body;
  
  if (!walletAddress) {
    return res.status(400).json({ error: 'Wallet address required' });
  }
  
  try {
    // Simple wallet connection without signature verification for demo
    let user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
    
    if (!user) {
      user = new User({
        walletAddress: walletAddress.toLowerCase(),
        name: 'Runner ' + walletAddress.slice(-4)
      });
      await user.save();
    }
    
    res.json({
      success: true,
      user: {
        id: user._id,
        walletAddress: user.walletAddress,
        name: user.name,
        totalPoints: user.totalPoints,
        totalActivities: user.totalActivities,
        zonesOwned: user.zonesOwned
      },
      message: 'Wallet connected successfully!'
    });
    
  } catch (error) {
    console.error('Wallet connection error:', error);
    res.status(500).json({ 
      error: 'Failed to connect wallet',
      details: error.message
    });
  }
});

// GET /api/auth/status - Check authentication status
router.get('/status', (req, res) => {
  res.json({
    authenticated: false,
    message: 'FitConquer uses wallet-based authentication. Connect your MetaMask wallet to authenticate.',
    supportedMethods: ['metamask', 'strava'],
    timestamp: new Date().toISOString()
  });
});

export default router;