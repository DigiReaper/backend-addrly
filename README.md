# DateMeDoc Backend - Complete Setup Guide

## 🎯 Overview

A complete dating application backend with AI-powered matchmaking using Google Gemini AI. Features text-based matching (interests, values, location, age) and URL-based context matching (AI content analysis).

## ✨ Features

- **Two-Tier Matching System**
  - Text-based matching: Interests (40%), Values (30%), Location (20%), Age (10%)
  - URL-based matching: AI-powered content extraction and compatibility analysis
  - Combined scoring with excellent/good/moderate/low recommendations

- **User Profile Management**
  - Complete onboarding flow with interests, values, lifestyle
  - Profile-based matching with other users
  - Personal website and social media integration

- **Date-Me-Doc System**
  - Create custom dating profiles with preferences
  - Custom question forms
  - Application submission and automatic matching

- **AI-Powered Analysis**
  - Google Gemini AI integration
  - Psychological profile analysis
  - Content extraction from URLs (LinkedIn, GitHub, personal websites)
  - Compatibility scoring

- **Authentication**
  - Supabase Auth integration
  - JWT token validation
  - User session management

## 🚀 Quick Start

### Prerequisites

- Node.js v22+ (LTS recommended)
- Supabase account
- Google Gemini AI API key

### 1. Environment Setup

Create `.env` file in the root directory:

```env
# Server
PORT=3000
NODE_ENV=development

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google Gemini AI
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.0-flash
```

### 2. Database Setup

**CRITICAL:** You must run the database setup script in Supabase SQL Editor before running the application.

1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to SQL Editor
4. Create a new query
5. Copy the entire contents of `SUPABASE_COMPLETE_SETUP.sql`
6. Click **RUN**

This will create all necessary tables:
- `user_profiles` - User information and preferences
- `date_me_docs` - Dating profile documents
- `applications` - Application submissions
- `content_analysis` - Extracted content and AI analysis
- `matchmaking_scores` - Match scores and compatibility data

### 3. Install Dependencies

```bash
npm install
```

### 4. Start the Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

Server will start at `http://localhost:3000`

### 5. Run Tests

```bash
# Run API tests
npm run test

# Run AI tests
npm run test:ai

# Run matching tests
npm run test:matching

# Run all tests
npm run test:all
```

## 📚 API Documentation

### User Profile Endpoints

#### Create Profile
```http
POST /api/users/profile
Content-Type: application/json

{
  "auth_user_id": "user-123",
  "email": "user@example.com",
  "name": "John Doe",
  "age": 28,
  "location": "San Francisco, CA",
  "gender": "male",
  "looking_for": ["female"],
  "bio": "Software engineer who loves hiking",
  "interests": ["technology", "hiking", "reading"],
  "hobbies": ["coding", "photography"],
  "values": ["honesty", "ambition", "kindness"],
  "lifestyle": {
    "exercise": "regular",
    "diet": "vegetarian",
    "smoking": "no",
    "drinking": "socially"
  }
}
```

#### Find Matches
```http
POST /api/users/find-matches
Content-Type: application/json

{
  "user_id": "user-profile-id",
  "include_url_matching": false,
  "limit": 10
}
```

Response includes match scores, compatibility breakdown, and recommendations.

### Date-Me-Doc Endpoints

#### Create Date-Me-Doc
```http
POST /api/date-me-docs
Content-Type: application/json

{
  "user_id": "user-profile-id",
  "title": "Date Me - Software Engineer in SF",
  "description": "Looking for someone who shares my passion for technology",
  "preferences": {
    "age_range": { "min": 25, "max": 35 },
    "location": ["San Francisco", "Bay Area"],
    "interests": ["technology", "hiking"]
  },
  "is_active": true,
  "custom_questions": [
    {
      "id": "q1",
      "question": "What do you like to do on weekends?",
      "type": "text",
      "required": true
    }
  ]
}
```

#### Get Date-Me-Doc
```http
GET /api/date-me-docs/:slug
```

### Application Endpoints

#### Submit Application
```http
POST /api/applications/:slug
Content-Type: application/json

{
  "applicant_email": "applicant@example.com",
  "applicant_name": "Jane Smith",
  "answers": {
    "q1": "I love hiking and photography!"
  },
  "submitted_links": {
    "linkedin": "https://linkedin.com/in/janesmith",
    "github": "https://github.com/janesmith"
  }
}
```

**Note:** The system automatically calculates match scores when applications are submitted. The matching service analyzes both text-based compatibility (interests, values, location, age) and URL-based context (if URLs provided).

#### Get Application Status
```http
GET /api/applications/:id/status
```

### Matching Endpoints

#### Match Application with Doc Owner
```http
POST /api/users/match-application
Content-Type: application/json

{
  "application_id": "app-id",
  "include_url_matching": true
}
```

Response includes:
- Overall match score (0-100)
- Text match score
- URL context score (if URLs provided)
- Compatibility breakdown
- Recommendation (excellent_match, good_match, moderate_match, low_match)

## 🧪 Testing

### API Test Coverage

The test suite covers:

1. **Health Check** - Server connectivity
2. **Content Extraction** - URL content scraping
3. **Rate Limiting** - API rate limits
4. **Date-Me-Doc Creation** - Profile creation
5. **Application Submission** - Application flow
6. **Profile Management** - User profiles
7. **Matching System** - Compatibility scoring

### Expected Test Results

After running `npm run test:all`, you should see:
- ✅ 9/9 API tests passing
- ✅ 3/3 AI tests passing
- ✅ 6/6 Matching tests passing

## 🏗️ Architecture

### Tech Stack
- **Runtime:** Node.js v22 (ESM modules)
- **Framework:** Express.js 4.18
- **Database:** Supabase PostgreSQL
- **AI:** Google Gemini AI (gemini-2.0-flash)
- **Auth:** Supabase Auth (JWT)
- **Testing:** Custom test suite with Axios

### Project Structure
```
backend-addrly/
├── src/
│   ├── config/
│   │   └── auth.js           # Auth middleware
│   ├── controllers/
│   │   ├── applicationController.js
│   │   ├── dateMeDocController.js
│   │   └── userController.js
│   ├── db/
│   │   └── supabase.js       # Database client
│   ├── middleware/
│   │   ├── auth.js           # Auth middleware
│   │   ├── errorHandler.js
│   │   ├── rateLimiter.js
│   │   └── validation.js
│   ├── routes/
│   │   ├── applicationRoutes.js
│   │   ├── dateMeDocRoutes.js
│   │   └── userRoutes.js
│   ├── services/
│   │   ├── contentExtractor.js      # URL content extraction
│   │   ├── matchingService.js       # Matching algorithms
│   │   └── psychologicalAnalyzer.js # AI analysis
│   └── index.js              # Entry point
├── tests/
│   ├── api.test.js          # API tests
│   ├── ai.test.js           # AI tests
│   └── matching.test.js     # Matching tests
├── SUPABASE_COMPLETE_SETUP.sql  # Database schema
├── .env                      # Environment variables
└── package.json
```

## 🔧 Troubleshooting

### Database Issues

**Error:** "Could not find the 'auth_user_id' column"
- **Solution:** Run `SUPABASE_COMPLETE_SETUP.sql` in Supabase SQL Editor

**Error:** "relation does not exist"
- **Solution:** Ensure all tables were created. Check Supabase Table Editor.

### API Issues

**Error:** "Invalid API key"
- **Solution:** Check `GEMINI_API_KEY` in `.env` file

**Error:** "Supabase connection failed"
- **Solution:** Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env`

### Test Failures

**Issue:** Tests timing out
- **Solution:** Ensure server is running (`npm run dev`) and database is set up

**Issue:** Low match scores
- **Solution:** This is expected if test profiles have low compatibility

## 📊 Matching Algorithm Details

### Text-Based Matching

The text-based matching algorithm calculates scores based on:

1. **Interests Match (40%)**
   - Compares common interests between profiles
   - Higher weight given to shared interests

2. **Values Match (30%)**
   - Analyzes alignment of core values
   - Important for long-term compatibility

3. **Location Match (20%)**
   - Same city: 100%
   - Same state: 50%
   - Different state: 0%

4. **Age Compatibility (10%)**
   - Within 2 years: 100%
   - Within 5 years: 75%
   - Within 10 years: 50%
   - More than 10 years: 25%

### URL-Based Matching

When URLs are provided:

1. **Content Extraction**
   - Extracts content from LinkedIn, GitHub, personal websites
   - Aggregates text content for analysis

2. **AI Analysis**
   - Uses Google Gemini AI to analyze content
   - Identifies interests, values, personality traits
   - Generates compatibility assessment

3. **Combined Scoring**
   - Text match: 40% weight
   - URL context: 60% weight
   - Overall score determines recommendation

### Scoring Categories

- **Excellent Match (80-100):** Highly compatible
- **Good Match (60-79):** Strong potential
- **Moderate Match (40-59):** Some compatibility
- **Low Match (0-39):** Limited compatibility

## 🔐 Security

- JWT token validation on protected endpoints
- Rate limiting (100 requests per 15 minutes)
- Input validation and sanitization
- SQL injection protection (Supabase client)
- CORS configuration

## 🚀 Deployment

### Environment Variables for Production

```env
NODE_ENV=production
PORT=3000
SUPABASE_URL=your-production-url
SUPABASE_SERVICE_ROLE_KEY=your-production-key
GEMINI_API_KEY=your-production-key
```

### Deployment Checklist

1. ✅ Set up production Supabase project
2. ✅ Run `SUPABASE_COMPLETE_SETUP.sql` in production
3. ✅ Update `.env` with production credentials
4. ✅ Install dependencies: `npm install --production`
5. ✅ Start server: `npm start`
6. ✅ Verify all tests pass: `npm run test:all`

## 📝 License

ISC

## 🤝 Support

For issues or questions, please check:
1. This README
2. `SUPABASE_COMPLETE_SETUP.sql` for database schema
3. Test files for usage examples

---

**Current Status:** ✅ 100% Complete - All features implemented, tested, and ready for use.
