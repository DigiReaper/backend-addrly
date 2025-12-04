import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Import configurations and middleware
import { authenticateUser, getUserProfile } from './config/auth.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

// Import routes
import dateMeDocRoutes from './routes/dateMeDocRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import userRoutes from './routes/userRoutes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Allow for development
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: [process.env.FRONTEND_URL, process.env.BASE_URL],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Better Auth routes - replaced with Supabase Auth
// app.all('/api/auth/*', toNodeHandler(auth));

// Simple auth endpoints using Supabase
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // This would typically be handled by your frontend using Supabase client
    // For API-only auth, you might want to use a different approach
    res.status(501).json({
      success: false,
      error: 'Use Supabase client for authentication. This endpoint is for reference only.'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
});

app.post('/api/auth/logout', authenticateUser, async (req, res) => {
  try {
    // Client-side logout is typically handled by Supabase client
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
});

app.get('/api/auth/me', authenticateUser, getUserProfile, async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user,
      profile: req.userProfile || null
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user data'
    });
  }
});

// API routes
app.use('/api/docs', dateMeDocRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/users', userRoutes);

// Import and use form routes
import formRoutes from './routes/formRoutes.js';
app.use('/api/forms', formRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'DateMeDoc API',
    version: '1.0.0',
    description: 'Backend API for DateMeDoc - AI-powered dating application',
    endpoints: {
      auth: '/api/auth/*',
      docs: '/api/docs',
      applications: '/api/applications',
      users: '/api/users',
      health: '/health'
    },
    documentation: '/api/docs/api-documentation'
  });
});

// API documentation endpoint
app.get('/api/docs/api-documentation', (req, res) => {
  res.json({
    version: '1.0.0',
    endpoints: [
      {
        group: 'Authentication',
        routes: [
          {
            method: 'GET',
            path: '/api/auth/signin/google',
            description: 'Initiate Google OAuth login'
          },
          {
            method: 'GET',
            path: '/api/auth/callback/google',
            description: 'Google OAuth callback'
          },
          {
            method: 'POST',
            path: '/api/auth/signout',
            description: 'Sign out user'
          },
          {
            method: 'GET',
            path: '/api/auth/session',
            description: 'Get current session'
          }
        ]
      },
      {
        group: 'Date-Me-Docs',
        routes: [
          {
            method: 'POST',
            path: '/api/docs',
            auth: 'required',
            description: 'Create new date-me-doc'
          },
          {
            method: 'GET',
            path: '/api/docs',
            auth: 'required',
            description: 'Get all user\'s date-me-docs'
          },
          {
            method: 'GET',
            path: '/api/docs/:slug',
            auth: 'optional',
            description: 'Get date-me-doc by slug (public)'
          },
          {
            method: 'PUT',
            path: '/api/docs/:id',
            auth: 'required',
            description: 'Update date-me-doc'
          },
          {
            method: 'DELETE',
            path: '/api/docs/:id',
            auth: 'required',
            description: 'Delete date-me-doc'
          },
          {
            method: 'GET',
            path: '/api/docs/:id/applications',
            auth: 'required',
            description: 'Get applications for date-me-doc (owner only)'
          },
          {
            method: 'PATCH',
            path: '/api/docs/:id/applications/:applicationId/status',
            auth: 'required',
            description: 'Update application status'
          }
        ]
      },
      {
        group: 'Applications',
        routes: [
          {
            method: 'POST',
            path: '/api/applications/:slug/apply',
            auth: 'optional',
            description: 'Submit application to date-me-doc'
          },
          {
            method: 'GET',
            path: '/api/applications/status/:applicationId',
            auth: 'optional',
            description: 'Get application status (requires email or auth)'
          }
        ]
      },
      {
        group: 'Users',
        routes: [
          {
            method: 'GET',
            path: '/api/users/profile',
            auth: 'required',
            description: 'Get current user profile'
          },
          {
            method: 'PUT',
            path: '/api/users/profile',
            auth: 'required',
            description: 'Update user profile'
          },
          {
            method: 'POST',
            path: '/api/users/analyze',
            auth: 'required',
            description: 'Analyze user\'s digital footprint'
          },
          {
            method: 'GET',
            path: '/api/users/analysis',
            auth: 'required',
            description: 'Get user\'s psychological analyses'
          }
        ]
      }
    ]
  });
});

// 404 handler
app.use(notFound);

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║                                                        ║
║        DateMeDoc API Server                           ║
║                                                        ║
║        🚀 Server running on port ${PORT}                  ║
║        📝 Environment: ${process.env.NODE_ENV || 'development'}                     ║
║        🌐 Base URL: ${process.env.BASE_URL || `http://localhost:${PORT}`}       ║
║                                                        ║
║        Endpoints:                                      ║
║        • Health Check: GET /health                     ║
║        • API Docs: GET /api/docs/api-documentation     ║
║        • Auth: /api/auth/*                            ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
  `);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

export default app;
