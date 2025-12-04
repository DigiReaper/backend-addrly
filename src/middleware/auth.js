import { authenticateUser, getUserProfile } from '../config/auth.js';

export const requireAuth = async (req, res, next) => {
  try {
    await authenticateUser(req, res, next);
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    // Try to authenticate, but don't fail if it doesn't work
    const originalJson = res.json;
    let authFailed = false;

    res.json = function(data) {
      if (data && data.error === 'Authorization header missing or invalid') {
        authFailed = true;
        return res;
      }
      return originalJson.call(this, data);
    };

    await authenticateUser(req, res, () => {
      // If authentication succeeds, get user profile
      getUserProfile(req, res, next);
    });

    // If we get here, authentication failed but we should continue
    if (authFailed) {
      next();
    }
  } catch (error) {
    // If auth fails, continue without user
    next();
  }
};
