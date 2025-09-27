export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: err.details 
    });
  }
  
  if (err.name === 'StravaAPIError') {
    return res.status(502).json({ 
      error: 'Strava API error', 
      message: err.message 
    });
  }
  
  if (err.name === 'BlockchainError') {
    return res.status(503).json({ 
      error: 'Blockchain operation failed', 
      message: err.message 
    });
  }
  
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
};
