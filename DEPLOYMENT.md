# 🚀 Deployment Guide - DateMeDoc Backend

## ⚠️ CRITICAL FIRST STEP: Database Setup

**YOU MUST DO THIS BEFORE RUNNING THE APPLICATION**

### Step 1: Run Database Setup in Supabase

1. Open your browser and go to: https://supabase.com/dashboard
2. Log in to your account
3. Select your project (jfpnzeegdapvjhuqozfy)
4. Click on **SQL Editor** in the left sidebar
5. Click **New Query**
6. Open the file `SUPABASE_COMPLETE_SETUP.sql` in this project
7. Copy **ALL** the contents (it's about 160 lines)
8. Paste into the Supabase SQL Editor
9. Click the **RUN** button (or press Ctrl+Enter)
10. Wait for "Success. No rows returned" message

**What this does:**
- Drops any existing tables (if they exist)
- Creates fresh tables with correct structure
- Sets up all necessary columns including `auth_user_id`
- Creates indexes for performance
- Sets up foreign key relationships

### Step 2: Verify Database Setup

After running the SQL script, verify in Supabase Table Editor:

1. Click **Table Editor** in left sidebar
2. You should see 5 tables:
   - ✅ user_profiles
   - ✅ date_me_docs
   - ✅ applications
   - ✅ content_analysis
   - ✅ matchmaking_scores

3. Click on `user_profiles` and verify it has these columns:
   - id
   - auth_user_id ← **CRITICAL**
   - email
   - name
   - age
   - location
   - gender
   - looking_for
   - bio
   - interests
   - hobbies
   - values
   - lifestyle
   - preferences
   - profile_completed
   - created_at
   - updated_at

If you don't see `auth_user_id`, the SQL script didn't run correctly. Try again.

## 📋 Pre-Flight Checklist

Before running the application, verify:

- ✅ Database setup completed (Step 1 above)
- ✅ `.env` file exists with correct credentials
- ✅ Node.js v22+ installed
- ✅ All dependencies installed (`npm install`)

## 🏃 Running the Application

### Development Mode

```bash
npm run dev
```

This starts the server with auto-reload on file changes.

### Production Mode

```bash
npm start
```

This starts the server without auto-reload (for production).

## 🧪 Testing the Application

### Test Sequence

Run tests in this order:

1. **Start the server first:**
   ```bash
   npm run dev
   ```
   Wait for "🚀 Server running on port 3000"

2. **In a new terminal, run API tests:**
   ```bash
   npm run test
   ```
   Expected: 9/9 tests passing

3. **Run AI tests:**
   ```bash
   npm run test:ai
   ```
   Expected: 3/3 tests passing

4. **Run matching tests:**
   ```bash
   npm run test:matching
   ```
   Expected: 6/6 tests passing

5. **Or run all at once:**
   ```bash
   npm run test:all
   ```

## 🔍 Troubleshooting

### Error: "Could not find the 'auth_user_id' column"

**Cause:** Database setup not completed
**Solution:** Go back to Step 1 and run the SQL script in Supabase

### Error: "relation 'user_profiles' does not exist"

**Cause:** Database tables not created
**Solution:** Run `SUPABASE_COMPLETE_SETUP.sql` in Supabase SQL Editor

### Error: "Invalid API key" (Gemini AI)

**Cause:** Wrong or missing GEMINI_API_KEY in .env
**Solution:** Check your `.env` file and verify the API key is correct

### Tests Failing

**Issue:** Tests timing out
**Solution:** Make sure server is running (`npm run dev`) in another terminal

**Issue:** "connect ECONNREFUSED"
**Solution:** Server not running. Start it with `npm run dev`

## 📊 Expected Test Results

### API Tests (npm run test)
```
✅ Health check working
✅ Content extraction from URL
✅ Rate limiting working
✅ Create date-me-doc
✅ Get date-me-doc by slug
✅ Submit application
✅ Get application status
✅ Create user profile
✅ Find user matches

📊 API Tests: 9/9 passed (100.0%)
```

### AI Tests (npm run test:ai)
```
✅ Psychological profile analysis
✅ Compatibility calculation
✅ Application match analysis

📊 AI Tests: 3/3 passed (100.0%)
```

### Matching Tests (npm run test:matching)
```
✅ Creating test user profiles
✅ Finding matches for user
✅ Creating date-me-doc
✅ Submitting application
✅ Match score calculated
✅ Manual application matching

📊 Matching Tests: 6/6 passed (100.0%)
```

## 🎯 What's Next?

After successful deployment:

1. **Test the API** - Use the test suite to verify everything works
2. **Review the README.md** - Complete documentation of all features
3. **Check the API endpoints** - See README for full API documentation
4. **Monitor the logs** - Watch for any errors during operation

## 🆘 Still Having Issues?

Check these files for more information:
- `README.md` - Complete documentation
- `SUPABASE_COMPLETE_SETUP.sql` - Database schema
- `tests/api.test.js` - API usage examples
- `tests/matching.test.js` - Matching system examples

---

**Remember:** The database setup (Step 1) is CRITICAL. Everything else will fail without it.
