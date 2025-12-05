import supabaseAdmin from '../db/supabase.js';

// Simple authentication middleware using Supabase Auth
export const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authorization header missing or invalid'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

// Optional: Middleware to get user profile
export const getUserProfile = async (req, res, next) => {
  try {
    if (!req.user) {
      return next();
    }

    const { data: profile, error } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('auth_user_id', req.user.id)
      .single();

    if (!error && profile) {
      req.userProfile = profile;
    }

    next();
  } catch (error) {
    console.error('Error fetching user profile:', error);
    next();
  }
};

export default {
  authenticateUser,
  getUserProfile
};
