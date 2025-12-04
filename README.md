# DateMeDoc Backend API

## Overview

DateMeDoc is a comprehensive dating application backend that uses AI-powered psychological analysis and matchmaking. Users create "Date-Me-Docs" - personalized dating profiles with custom application forms. When people apply, the system analyzes their digital footprint (Twitter, blogs, personal websites) to determine compatibility.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Better Auth (Google OAuth)
- **AI/ML**: OpenAI GPT-4 for psychological analysis
- **Content Extraction**: Cheerio, Twitter API v2
- **Queue**: BullMQ (Redis-based)

## Features

### Core Functionality

1. **User Authentication**
   - Google OAuth via Better Auth
   - Session management
   - User profiles with digital footprint tracking

2. **Date-Me-Docs**
   - Create custom dating profiles
   - Build custom application forms (text, textarea, URL, email, video, select fields)
   - Public sharing via unique slugs
   - View and application tracking

3. **Application System**
   - Submit applications with custom answers
   - Include social media links (Twitter, Instagram, personal websites, blogs)
   - Automatic content extraction from submitted links
   - Asynchronous processing with job queue

4. **AI-Powered Analysis**
   - **Content Extraction**: Scrapes and extracts text from websites, blogs, Twitter
   - **Psychological Profiling**: Analyzes personality traits (Big Five), communication style, values, interests
   - **Compatibility Matching**: Calculates compatibility scores based on psychological profiles
   - **Application Matching**: Evaluates how well application answers match doc owner's preferences

5. **Matchmaking**
   - Overall compatibility scores (0-100)
   - Breakdown by category (personality, interests, values, communication, lifestyle)
   - Red flags and green flags identification
   - Conversation topic suggestions
   - Date ideas based on shared interests

## Project Structure

```
backend-addrly/
├── src/
│   ├── config/
│   │   └── auth.js                 # Better Auth configuration
│   ├── controllers/
│   │   ├── applicationController.js # Application submission & processing
│   │   ├── dateMeDocController.js  # Date-me-doc CRUD operations
│   │   └── userController.js       # User profile management
│   ├── db/
│   │   ├── schema.sql              # Database schema
│   │   ├── supabase.js             # Supabase client
│   │   └── migrate.js              # Migration script
│   ├── middleware/
│   │   ├── auth.js                 # Authentication middleware
│   │   ├── errorHandler.js         # Error handling
│   │   └── validation.js           # Request validation
│   ├── routes/
│   │   ├── applicationRoutes.js    # Application endpoints
│   │   ├── dateMeDocRoutes.js      # Date-me-doc endpoints
│   │   └── userRoutes.js           # User endpoints
│   ├── services/
│   │   ├── contentExtractor.js     # Web scraping & Twitter API
│   │   └── psychologicalAnalyzer.js # AI analysis & matching
│   └── index.js                    # Main server file
├── .env.example                     # Environment variables template
├── .gitignore
└── package.json
```

## API Endpoints

### Authentication (Better Auth)

```
GET  /api/auth/signin/google        - Initiate Google OAuth
GET  /api/auth/callback/google      - Google OAuth callback
POST /api/auth/signout              - Sign out
GET  /api/auth/session              - Get current session
```

### Date-Me-Docs

```
POST   /api/docs                    - Create date-me-doc (auth required)
GET    /api/docs                    - Get user's date-me-docs (auth required)
GET    /api/docs/:slug              - Get date-me-doc by slug (public)
PUT    /api/docs/:id                - Update date-me-doc (auth required)
DELETE /api/docs/:id                - Delete date-me-doc (auth required)
GET    /api/docs/:id/applications   - Get applications (owner only)
PATCH  /api/docs/:id/applications/:applicationId/status - Update application status
```

### Applications

```
POST /api/applications/:slug/apply             - Submit application
GET  /api/applications/status/:applicationId   - Get application status
```

### Users

```
GET  /api/users/profile    - Get user profile (auth required)
PUT  /api/users/profile    - Update profile (auth required)
POST /api/users/analyze    - Analyze digital footprint (auth required)
GET  /api/users/analysis   - Get psychological analyses (auth required)
```

### System

```
GET /health                           - Health check
GET /api/docs/api-documentation       - API documentation
```

## Database Schema

### Tables

1. **user_profiles** - Extended user information
2. **date_me_docs** - Date-me-doc profiles and forms
3. **applications** - Application submissions
4. **content_analysis** - Extracted content and psychological profiles
5. **matchmaking_scores** - Compatibility scores and recommendations
6. **analysis_jobs** - Job queue for async processing

See `src/db/schema.sql` for complete schema.

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ installed
- Supabase account and project
- Google Cloud Console project (for OAuth)
- OpenAI API key
- Twitter Developer account (optional)
- Redis instance (for job queue)

### 2. Installation

```bash
cd backend-addrly
npm install
```

### 3. Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

### 4. Configure Required API Keys

Edit `.env` file with your credentials:

#### Supabase Setup
1. Create a Supabase project at https://supabase.com
2. Get credentials from Settings → API
   - `SUPABASE_URL`: Your project URL
   - `SUPABASE_ANON_KEY`: Anon public key
   - `SUPABASE_SERVICE_ROLE_KEY`: Service role key (keep secret!)

#### Google OAuth Setup
1. Go to https://console.cloud.google.com
2. Create a new project or select existing
3. Enable Google+ API
4. Go to Credentials → Create Credentials → OAuth 2.0 Client ID
5. Set authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`

#### OpenAI Setup
1. Go to https://platform.openai.com
2. Create API key from API Keys section
3. Set `OPENAI_API_KEY`
4. Recommended model: `gpt-4-turbo-preview`

#### Twitter API Setup (Optional but Recommended)
1. Apply for Twitter Developer account at https://developer.twitter.com
2. Create an app
3. Generate Bearer Token and API keys
4. Set:
   - `TWITTER_BEARER_TOKEN`
   - `TWITTER_API_KEY`
   - `TWITTER_API_SECRET`
   - `TWITTER_ACCESS_TOKEN`
   - `TWITTER_ACCESS_SECRET`

#### Redis Setup
1. Install Redis locally or use cloud service (Redis Cloud, Upstash)
2. Set:
   - `REDIS_HOST`
   - `REDIS_PORT`
   - `REDIS_PASSWORD` (if applicable)

#### Better Auth
1. Generate a random 32+ character secret:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
2. Set `BETTER_AUTH_SECRET` to the generated value

### 5. Database Migration

Run the database schema in Supabase:

**Option A: Using SQL Editor (Recommended)**
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy contents of `src/db/schema.sql`
4. Paste and run

**Option B: Using Migration Script**
```bash
npm run migrate
```

### 6. Start Development Server

```bash
npm run dev
```

Server will start on `http://localhost:3000`

### 7. Production Deployment

```bash
npm start
```

## API Request Examples

### Create a Date-Me-Doc

```javascript
POST /api/docs
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Boyfriend Application",
  "slug": "my-boyfriend-app",
  "description": "Looking for someone who shares my love for coffee and deep conversations",
  "header_content": "## About Me\n\nI'm a software engineer who loves building things...",
  "preferences": {
    "age_range": "25-35",
    "location": "San Francisco",
    "interests": ["tech", "coffee", "hiking"]
  },
  "form_questions": [
    {
      "id": "q1",
      "question": "What's your name?",
      "type": "text",
      "required": true,
      "order": 0
    },
    {
      "id": "q2",
      "question": "Tell me about your favorite book",
      "type": "textarea",
      "required": true,
      "order": 1
    },
    {
      "id": "q3",
      "question": "Your Twitter handle",
      "type": "url",
      "required": false,
      "order": 2
    }
  ],
  "is_public": true
}
```

### Submit an Application

```javascript
POST /api/applications/my-boyfriend-app/apply
Content-Type: application/json

{
  "applicant_email": "john@example.com",
  "applicant_name": "John Doe",
  "answers": {
    "q1": "John Doe",
    "q2": "I love 'Sapiens' by Yuval Noah Harari. It changed how I think about humanity...",
    "q3": "https://twitter.com/johndoe"
  },
  "submitted_links": [
    {
      "type": "twitter",
      "url": "https://twitter.com/johndoe",
      "handle": "johndoe"
    },
    {
      "type": "website",
      "url": "https://johndoe.com"
    },
    {
      "type": "blog",
      "url": "https://medium.com/@johndoe"
    }
  ]
}
```

### Response with Analysis

```javascript
{
  "message": "Application submitted successfully",
  "application": {
    "id": "uuid",
    "status": "pending",
    "submitted_at": "2025-12-04T10:30:00Z"
  }
}

// After async processing (query status endpoint):
{
  "application": {
    "id": "uuid",
    "status": "reviewed",
    "compatibility_score": 87.5,
    "analysis_completed": true,
    "matchmaking_scores": {
      "overall_score": 87.5,
      "recommendation": "strong_match",
      "confidence_level": 0.85,
      "compatibility_breakdown": {
        "personality_match": 85,
        "interests_overlap": 92,
        "values_alignment": 88,
        "communication_compatibility": 90,
        "lifestyle_compatibility": 82,
        "intellectual_compatibility": 89,
        "emotional_compatibility": 84,
        "humor_compatibility": 78
      },
      "green_flags": [
        {
          "flag": "Strong intellectual curiosity",
          "strength": "high",
          "explanation": "Both show deep interest in learning and philosophical discussions"
        }
      ],
      "date_ideas": [
        "Coffee shop book discussion",
        "Visit to science museum",
        "Hiking with deep conversations"
      ]
    }
  }
}
```

## Key Features Explained

### Content Extraction

The system extracts content from various sources:

- **Twitter**: Uses Twitter API v2 to fetch user bio, recent tweets (up to 100)
- **Websites/Blogs**: Scrapes using Cheerio, intelligently identifies main content areas
- **Personal Websites**: Extracts blog posts, about pages, project descriptions

### Psychological Analysis

Uses OpenAI GPT-4 to analyze extracted content and generate:

1. **Big Five Personality Traits**
   - Openness (0-1)
   - Conscientiousness (0-1)
   - Extraversion (0-1)
   - Agreeableness (0-1)
   - Neuroticism (0-1)

2. **Communication Style**
   - Primary style (analytical, emotional, casual, formal, humorous)
   - Tone and vocabulary level
   - Authenticity score

3. **Interests & Passions**
   - Extracted topics and hobbies
   - Deep passions
   - Core values

4. **Relationship Indicators**
   - Attachment style
   - Commitment readiness
   - Emotional availability

### Compatibility Matching

Combines multiple factors:

1. **Psychological Compatibility** (70% weight)
   - Personality trait complementarity
   - Shared interests and values
   - Communication style compatibility

2. **Preference Matching** (30% weight)
   - How well applicant matches stated preferences
   - Answer quality and authenticity
   - Effort and thoughtfulness

Final score: 0-100 with confidence level

### Async Processing

Applications are processed asynchronously:

1. Application submitted → Returns immediately
2. Job queued for content extraction
3. Content extracted from all submitted links
4. Psychological profile generated
5. Compatibility calculated with doc owner
6. Matchmaking score stored
7. Application status updated

Users can check status anytime via status endpoint.

## Performance Considerations

- Rate limiting: 100 requests per 15 minutes per IP
- Content extraction timeout: 10 seconds per URL
- Maximum content length: 50,000 characters
- Batch processing for multiple links
- Redis caching for session management
- Async processing prevents API timeouts

## Security

- Helmet.js for security headers
- CORS configured for specific origins
- Rate limiting on all API endpoints
- Input validation with Joi
- SQL injection protection via Supabase
- Service role key never exposed to client
- Session-based authentication

## Error Handling

All errors return consistent format:

```javascript
{
  "error": "Error message",
  "details": [ /* validation errors if applicable */ ]
}
```

HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request (validation error)
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 429: Too Many Requests
- 500: Internal Server Error

## Monitoring

- Health check endpoint: `GET /health`
- Morgan logging (dev/combined modes)
- Error logging to console
- Job status tracking in database

## Scaling Considerations

The architecture supports scaling:

1. **Horizontal Scaling**: Stateless API, can run multiple instances
2. **Database**: Supabase handles scaling automatically
3. **Job Queue**: Redis/BullMQ for distributed job processing
4. **Caching**: Redis for session and data caching
5. **CDN**: Can add for static assets
6. **Load Balancer**: Can add for multiple API instances

## Future Enhancements

Potential additions:

1. Video response analysis (using Whisper API)
2. Instagram content extraction (requires Graph API access)
3. Spotify listening habits analysis
4. Real-time notifications (WebSockets)
5. Admin dashboard
6. Analytics and insights
7. Payment integration for premium features
8. Email notifications
9. Chat system for matches

## Troubleshooting

### Common Issues

**Database Connection Error**
- Verify Supabase credentials in `.env`
- Check if project is active in Supabase dashboard

**Authentication Not Working**
- Verify Google OAuth credentials
- Check redirect URI matches exactly
- Ensure BETTER_AUTH_SECRET is set

**Twitter Extraction Fails**
- Twitter API is optional; app works without it
- Verify Twitter Bearer Token if configured
- Check API rate limits

**OpenAI Analysis Fails**
- Verify API key is valid
- Check OpenAI account has credits
- Model must be accessible (gpt-4-turbo-preview)

**Redis Connection Error**
- Verify Redis is running
- Check connection credentials
- Can use local Redis or cloud service

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## License

MIT License

## Support

For issues and questions:
- GitHub Issues
- Documentation: See this README

---

## Quick Start Checklist

- [ ] Install Node.js 18+
- [ ] Clone repository
- [ ] Run `npm install`
- [ ] Create Supabase project
- [ ] Set up Google OAuth
- [ ] Get OpenAI API key
- [ ] Copy `.env.example` to `.env`
- [ ] Fill in all environment variables
- [ ] Run database migration
- [ ] Start dev server: `npm run dev`
- [ ] Test health check: `http://localhost:3000/health`
- [ ] Test Google login: `http://localhost:3000/api/auth/signin/google`

You're ready to go! 🚀
