# Setup Checklist

Complete this checklist to get your DateMeDoc backend running.

## ✅ Prerequisites

- [ ] Node.js v18+ installed (`node --version`)
- [ ] PostgreSQL access (via Supabase)
- [ ] Redis installed and running (`redis-cli ping`)
- [ ] Google Cloud Console account
- [ ] Google AI Studio account (for Gemini API)

## 📦 1. Installation

```bash
cd backend-addrly
npm install
```

**Verify**: Should see "added X packages" with no errors.

## 🔑 2. Environment Variables

Create `.env` file from `.env.example`:

```bash
cp .env.example .env
```

Fill in these REQUIRED variables:

### Server Configuration
- [ ] `PORT=3000`
- [ ] `NODE_ENV=development`
- [ ] `BASE_URL=http://localhost:3000`
- [ ] `FRONTEND_URL=http://localhost:5173`

### Supabase Configuration
- [ ] `SUPABASE_URL` - From Supabase project settings
- [ ] `SUPABASE_ANON_KEY` - From Supabase project settings
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - From Supabase project settings

### Better Auth Configuration
- [ ] `BETTER_AUTH_SECRET` - Generate: `openssl rand -base64 32`
- [ ] `BETTER_AUTH_URL=http://localhost:3000`

### Google OAuth
- [ ] `GOOGLE_CLIENT_ID` - From Google Cloud Console
- [ ] `GOOGLE_CLIENT_SECRET` - From Google Cloud Console

### Google Gemini AI
- [ ] `GEMINI_API_KEY` - From https://makersuite.google.com/app/apikey
- [ ] `GEMINI_MODEL_NAME=gemini-pro`

### Redis
- [ ] `REDIS_HOST=localhost`
- [ ] `REDIS_PORT=6379`
- [ ] `REDIS_PASSWORD=` (leave empty if no password)

**See `docs/API_KEYS_SETUP.md` for detailed instructions.**

## 🗄️ 3. Database Setup

### Run Migrations
```bash
npm run migrate
```

**Verify**: Check Supabase dashboard for these tables:
- [ ] `user_profiles`
- [ ] `date_me_docs`
- [ ] `applications`
- [ ] `content_analysis`
- [ ] `matchmaking_scores`
- [ ] `analysis_jobs`
- [ ] Better Auth tables (session, account, user, verification)

## 🚀 4. Start Server

```bash
npm run dev
```

**Expected Output**:
```
Server running on port 3000
Redis client ready
Database connected
```

**Verify**: Visit http://localhost:3000/health
```json
{
  "status": "ok",
  "timestamp": "2025-01-..."
}
```

## 🧪 5. Run Tests

### Basic API Tests
```bash
npm test
```

**Expected**: All 9 tests should pass
- [ ] Health Check ✓
- [ ] Create Date-Me-Doc ✓
- [ ] Get Date-Me-Doc ✓
- [ ] Update Date-Me-Doc ✓
- [ ] Submit Application ✓
- [ ] Get Applications ✓
- [ ] Content Extraction ✓
- [ ] Analysis Job ✓
- [ ] Rate Limiting ✓

### AI Tests (requires Gemini API key)
```bash
npm run test:ai
```

**Expected**: All 3 tests should pass
- [ ] Psychological Analysis ✓
- [ ] Compatibility Matching ✓
- [ ] Application Match ✓

**Note**: Each AI test takes 30-60 seconds.

## 🔧 Troubleshooting

### ❌ "Cannot connect to server"
**Solution**: Make sure server is running with `npm run dev`

### ❌ "Database connection failed"
**Solution**: Check Supabase credentials in `.env`

### ❌ "Redis connection failed"
**Solution**: 
1. Check if Redis is running: `redis-cli ping` (should return "PONG")
2. Start Redis: `redis-server`

### ❌ "API key not configured"
**Solution**: Add `GEMINI_API_KEY` to `.env`

### ❌ "ERR_PACKAGE_PATH_NOT_EXPORTED"
**Solution**: Already fixed in `src/config/auth.js` - uses direct postgres configuration

### ❌ Tests fail with "Gemini error"
**Solution**: 
1. Verify API key is correct
2. Check rate limits (60 requests/minute on free tier)
3. Wait a few minutes and retry

## 📚 6. Read Documentation

Familiarize yourself with:
- [ ] `README.md` - Overview and features
- [ ] `docs/QUICKSTART.md` - Quick setup guide
- [ ] `docs/API_KEYS_SETUP.md` - Detailed API key instructions
- [ ] `docs/API_DOCUMENTATION.md` - All endpoints
- [ ] `docs/TESTING.md` - Testing guide
- [ ] `MIGRATION_SUMMARY.md` - Recent changes

## 🎯 7. Next Steps

Once everything is working:

1. **Frontend Integration**
   - Update frontend to use `http://localhost:3000`
   - Implement Google OAuth flow
   - Build date-me-doc creation UI

2. **Production Deployment**
   - Set up production database
   - Configure production Redis
   - Deploy to your hosting platform
   - Update CORS settings for production domain

3. **Monitoring**
   - Set up error logging (Sentry, LogRocket)
   - Monitor API usage
   - Track Gemini API rate limits

## ✅ Final Verification

Run all checks:
```bash
# 1. Check server health
curl http://localhost:3000/health

# 2. Run all tests
npm run test:all

# 3. Check no errors in console
```

All green? You're ready to go! 🚀

## 📞 Need Help?

- Check `docs/TROUBLESHOOTING.md`
- Review error logs in console
- Verify all environment variables
- Ensure all services are running (Node, Redis, Supabase)

---

**Last Updated**: January 2025  
**Required Node Version**: 18+  
**Required Dependencies**: Redis, PostgreSQL (via Supabase)
