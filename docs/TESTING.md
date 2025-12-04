# Testing Guide

This guide explains how to test the backend API endpoints and AI features.

## Prerequisites

1. **Server Running**: Start the server first
   ```bash
   npm run dev
   ```

2. **Environment Variables**: Ensure your `.env` file has:
   - `GEMINI_API_KEY` - Google Gemini API key
   - `SUPABASE_URL` and keys
   - `REDIS_HOST` and port
   - All other required config

3. **Dependencies**: Install test dependencies
   ```bash
   npm install
   ```

## Running Tests

### Run All Tests
```bash
npm run test:all
```

### Run API Tests Only
Tests basic CRUD operations and endpoints:
```bash
npm test
```

Tests include:
- ✓ Health check
- ✓ Create date-me-doc
- ✓ Get date-me-doc
- ✓ Update date-me-doc
- ✓ Submit application
- ✓ Get applications
- ✓ Content extraction
- ✓ Analysis job creation
- ✓ Rate limiting

### Run AI Tests Only
Tests Google Gemini AI features (takes longer):
```bash
npm run test:ai
```

Tests include:
- ✓ Psychological profile analysis
- ✓ Compatibility matching
- ✓ Application match analysis

**Note**: AI tests require a valid `GEMINI_API_KEY` and may take 30-60 seconds per test.

## Test Output

Tests provide colored output:
- ✅ **Green checkmark** = Test passed
- ❌ **Red X** = Test failed
- ℹ️ **Blue info** = Information message
- ⚠️ **Yellow warning** = Warning message

Example output:
```
============================================================
  BACKEND API TEST SUITE
============================================================

ℹ === Testing Health Check ===
✓ Health check passed

ℹ === Testing Create Date-Me-Doc ===
✓ Date-Me-Doc created with ID: 123
  Title: Test Date-Me-Doc
  Interests: 5 items
  Questions: 2 items

...

============================================================
  TEST SUMMARY
============================================================
✓ Health Check
✓ Create Date-Me-Doc
✓ Get Date-Me-Doc
...

============================================================
Results: 9/9 tests passed (100.0%)
============================================================
```

## Manual Testing

### 1. Test Health Endpoint
```bash
curl http://localhost:3000/health
```

### 2. Create Date-Me-Doc
```bash
curl -X POST http://localhost:3000/api/docs \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Date-Me-Doc",
    "description": "Looking for meaningful connections",
    "about_me": "I love coding and hiking",
    "interests": ["coding", "hiking"],
    "custom_questions": [
      {
        "question": "What is your favorite book?",
        "required": true,
        "type": "text"
      }
    ]
  }'
```

### 3. Submit Application
```bash
curl -X POST http://localhost:3000/api/applications \
  -H "Content-Type: application/json" \
  -d '{
    "date_me_doc_id": "YOUR_DOC_ID",
    "applicant_name": "John Doe",
    "applicant_email": "john@example.com",
    "applicant_bio": "Software engineer who loves hiking",
    "answers": {
      "What is your favorite book?": "The Alchemist"
    }
  }'
```

### 4. Extract Content
```bash
curl -X POST http://localhost:3000/api/users/extract-content \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "type": "website"
  }'
```

### 5. Test AI Analysis
```bash
curl -X POST http://localhost:3000/api/users/analyze-profile \
  -H "Content-Type: application/json" \
  -d '{
    "profile": {
      "bio": "Software engineer passionate about AI and hiking",
      "interests": ["coding", "hiking", "AI"],
      "content": {
        "texts": ["I love building innovative solutions"]
      }
    }
  }'
```

## Troubleshooting

### Server Not Running
```
Error: Cannot connect to server
```
**Solution**: Start the server with `npm run dev`

### Missing API Key
```
Error: API key not configured
```
**Solution**: Add `GEMINI_API_KEY` to your `.env` file

### Database Connection Failed
```
Error: Database connection error
```
**Solution**: Check Supabase credentials in `.env`

### Rate Limit Exceeded
```
Error: Too many requests
```
**Solution**: Wait a few minutes or adjust `RATE_LIMIT_MAX_REQUESTS` in `.env`

## Test Data Cleanup

The test suite automatically cleans up after itself by:
1. Deleting created applications
2. Deleting created date-me-docs

If cleanup fails, you can manually delete test data from Supabase dashboard.

## CI/CD Integration

To integrate these tests into CI/CD:

```yaml
# Example GitHub Actions workflow
- name: Run Tests
  run: |
    npm install
    npm run migrate
    npm run test:all
  env:
    GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
    SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    # ... other env vars
```

## Writing Custom Tests

To add your own tests, create a new file in `tests/` directory:

```javascript
import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

async function testMyFeature() {
  try {
    const response = await axios.get(`${BASE_URL}/api/my-endpoint`);
    console.log('✓ Test passed');
    return true;
  } catch (error) {
    console.error('✗ Test failed:', error.message);
    return false;
  }
}

testMyFeature();
```

## Performance Testing

For load testing, consider using:
- **Artillery**: `npm install -g artillery`
- **k6**: Load testing tool
- **Apache JMeter**: GUI-based load testing

Example Artillery test:
```yaml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - flow:
      - get:
          url: '/health'
```

## Support

If tests fail consistently:
1. Check server logs for errors
2. Verify all environment variables
3. Ensure database migrations ran successfully
4. Check Redis connection
5. Verify Gemini API key is valid
