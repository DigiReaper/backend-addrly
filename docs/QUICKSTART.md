# DateMeDoc Backend - Quick Start Guide

This guide will get you up and running in 30 minutes.

---

## Prerequisites

- Node.js 18+ installed
- Git installed
- Text editor (VS Code recommended)
- Terminal/Command line access

---

## Step 1: Clone & Install (2 minutes)

```bash
cd backend-addrly
npm install
```

---

## Step 2: Setup Supabase (5 minutes)

1. Go to https://supabase.com
2. Create account & new project
3. Wait for project to provision
4. Go to Settings → API
5. Copy these to a text file:
   - Project URL
   - Anon key
   - Service role key

---

## Step 3: Setup Google OAuth (8 minutes)

1. Go to https://console.cloud.google.com
2. Create new project
3. Enable Google+ API
4. Setup OAuth consent screen (External)
5. Create OAuth 2.0 credentials (Web application)
6. Add redirect URI: `http://localhost:3000/api/auth/callback/google`
7. Copy Client ID and Client Secret

---

## Step 4: Setup OpenAI (3 minutes)

1. Go to https://platform.openai.com
2. Create account / Login
3. Add payment method
4. Create API key
5. Copy the key

---

## Step 5: Install Redis (3 minutes)

**Windows (PowerShell as Admin):**
```powershell
choco install redis-64
redis-server
```

**Mac:**
```bash
brew install redis
brew services start redis
```

**Or use cloud Redis**: https://upstash.com (free tier)

---

## Step 6: Configure Environment (5 minutes)

1. Copy the example file:
```bash
cp .env.example .env
```

2. Edit `.env` file and fill in:

```env
# Supabase (from Step 2)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Google OAuth (from Step 3)
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret

# OpenAI (from Step 4)
OPENAI_API_KEY=sk-proj-xxxxx
OPENAI_MODEL=gpt-4-turbo-preview

# Better Auth Secret (generate new one)
# Run: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
BETTER_AUTH_SECRET=your_generated_secret

# Redis (local)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Leave these as is
PORT=3000
NODE_ENV=development
BASE_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173
BETTER_AUTH_URL=http://localhost:3000
```

---

## Step 7: Setup Database (2 minutes)

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Click "New Query"
4. Copy entire contents of `src/db/schema.sql`
5. Paste and click "Run"
6. Verify tables created (check Table Editor)

---

## Step 8: Start Server (1 minute)

```bash
npm run dev
```

You should see:
```
╔════════════════════════════════════════════════════════╗
║        DateMeDoc API Server                           ║
║        🚀 Server running on port 3000                 ║
╚════════════════════════════════════════════════════════╝
```

---

## Step 9: Test It! (1 minute)

Open browser and visit:

1. **Health Check**: http://localhost:3000/health
   - Should return: `{"status": "ok", ...}`

2. **API Docs**: http://localhost:3000/api/docs/api-documentation
   - Should show all endpoints

3. **Google Login**: http://localhost:3000/api/auth/signin/google
   - Should redirect to Google login
   - Login and should redirect back

---

## Step 10: Create Your First Date-Me-Doc

### Using Postman/Insomnia:

1. **Login via Browser First** (Step 9.3)

2. **Get Session Cookie** from browser DevTools → Application → Cookies

3. **Create Date-Me-Doc**:

```bash
POST http://localhost:3000/api/docs
Content-Type: application/json
Cookie: [paste your session cookie]

{
  "title": "My Awesome Date-Me-Doc",
  "slug": "my-awesome-doc",
  "description": "Looking for someone special!",
  "header_content": "## About Me\n\nI love coding and coffee!",
  "preferences": {
    "interests": ["tech", "coffee", "books"]
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
      "question": "Tell me about yourself",
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
  ]
}
```

4. **View Your Doc**:
```
GET http://localhost:3000/api/docs/my-awesome-doc
```

5. **Submit Test Application**:

```bash
POST http://localhost:3000/api/applications/my-awesome-doc/apply
Content-Type: application/json

{
  "applicant_email": "test@example.com",
  "applicant_name": "Test User",
  "answers": {
    "q1": "Test User",
    "q2": "I'm a software engineer who loves building cool stuff!",
    "q3": "https://twitter.com/example"
  },
  "submitted_links": [
    {
      "type": "website",
      "url": "https://example.com"
    }
  ]
}
```

6. **Check Application Status**:
```
GET http://localhost:3000/api/applications/status/[application_id]?email=test@example.com
```

---

## Common Issues & Fixes

### "Cannot connect to database"
- Check Supabase URL is correct
- Verify project is not paused
- Check API keys are correct

### "Google OAuth error"
- Verify redirect URI matches exactly
- Check client ID and secret
- Add your email to test users

### "OpenAI API error"
- Verify API key is correct
- Add payment method to OpenAI account
- Check you have credits available

### "Redis connection failed"
- Ensure Redis is running: `redis-cli ping`
- Should return `PONG`
- Check port 6379 is not blocked

### "Module not found"
- Run `npm install` again
- Delete `node_modules` and reinstall

---

## What's Next?

### Connect Your Frontend

Update your frontend environment:
```env
VITE_API_URL=http://localhost:3000
VITE_AUTH_URL=http://localhost:3000/api/auth
```

### Add More Features

- User profile enhancement
- Application review dashboard
- Email notifications
- Real-time updates
- Video responses

### Deploy to Production

See `DEPLOYMENT.md` for full guide.

---

## Testing the AI Analysis

To see the full AI-powered matchmaking:

1. Create a date-me-doc with preferences
2. Submit application with real links:
   - Twitter profile with tweets
   - Personal blog/website
   - Medium articles
3. Wait 30-60 seconds for analysis
4. Check application status
5. View compatibility scores and insights!

---

## Project Structure Overview

```
src/
├── config/         - Better Auth configuration
├── controllers/    - Request handlers
├── db/            - Database & migrations
├── middleware/    - Auth, validation, errors
├── routes/        - API endpoints
├── services/      - AI, content extraction
└── index.js       - Main server
```

---

## Available Scripts

```bash
npm run dev      # Start development server (auto-reload)
npm start        # Start production server
npm run migrate  # Run database migrations
```

---

## API Endpoints Quick Reference

```
Authentication:
  GET  /api/auth/signin/google
  GET  /api/auth/session

Date-Me-Docs:
  POST   /api/docs
  GET    /api/docs
  GET    /api/docs/:slug
  PUT    /api/docs/:id
  DELETE /api/docs/:id

Applications:
  POST /api/applications/:slug/apply
  GET  /api/applications/status/:id

Users:
  GET  /api/users/profile
  PUT  /api/users/profile
  POST /api/users/analyze
```

---

## Development Tips

### Hot Reload
Uses nodemon - any code changes auto-restart server

### Debugging
Add breakpoints in VS Code or use:
```javascript
console.log('Debug:', variable);
```

### Database Queries
Check Supabase dashboard → Table Editor to see data

### Testing Auth
Use browser DevTools → Application → Cookies

### API Testing
Use Postman, Insomnia, or curl

---

## Getting Help

- **Documentation**: README.md, API_KEYS_SETUP.md
- **API Docs**: http://localhost:3000/api/docs/api-documentation
- **Issues**: Create GitHub issue
- **Email**: your-email@example.com

---

## Success Checklist

- [ ] Server running on port 3000
- [ ] Health check returns OK
- [ ] Google login works
- [ ] Can create date-me-doc
- [ ] Can view date-me-doc by slug
- [ ] Can submit application
- [ ] Redis connected
- [ ] Database has tables
- [ ] Environment variables set

---

## 🎉 Congratulations!

You now have a fully functional AI-powered dating app backend!

**What you built:**
- ✅ Secure authentication
- ✅ Custom form builder
- ✅ Content extraction from web/Twitter
- ✅ AI psychological analysis
- ✅ Compatibility matchmaking
- ✅ RESTful API

**Time to build something amazing! 🚀**

---

## Next Steps

1. **Test thoroughly** - Try different scenarios
2. **Connect frontend** - Build the UI
3. **Customize analysis** - Tune AI prompts
4. **Add features** - Video, notifications, etc.
5. **Deploy** - Share with users!

**Happy coding! 💻**
