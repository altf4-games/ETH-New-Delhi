import jwt from 'jsonwebtoken';

export const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    // For demo purposes, create a mock user
    req.user = {
      id: 'demo_user_123',
      stravaId: '12345678',
      username: 'demo_runner',
      profile: {
        name: 'Demo Runner',
        avatar: 'https://via.placeholder.com/150'
      }
    };
    return next();
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};