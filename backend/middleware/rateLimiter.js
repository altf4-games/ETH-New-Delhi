const rateLimitMap = new Map();

export const rateLimiter = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 1000; // requests per window
  
  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return next();
  }
  
  const record = rateLimitMap.get(ip);
  
  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + windowMs;
    return next();
  }
  
  if (record.count >= maxRequests) {
    return res.status(429).json({ 
      error: 'Too many requests', 
      retryAfter: Math.ceil((record.resetTime - now) / 1000) 
    });
  }
  
  record.count++;
  next();
};