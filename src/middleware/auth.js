import auth from '../config/auth.js';

export const requireAuth = async (req, res, next) => {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }

    req.user = session.user;
    req.session = session;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    
    if (session) {
      req.user = session.user;
      req.session = session;
    }
    
    next();
  } catch (error) {
    // If auth fails, continue without user
    next();
  }
};
