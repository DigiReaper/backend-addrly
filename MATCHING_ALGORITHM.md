# 🎯 Matching Algorithm Reference

## Overview

The DateMeDoc backend uses a sophisticated two-tier matching system that combines traditional text-based matching with AI-powered URL content analysis.

---

## 📊 Matching Weights

### When Only Text-Based Matching
- Text Match: **100%**

### When Both Text and URL Matching
- Text Match: **40%**
- URL Context: **60%**

---

## 🔤 Text-Based Matching Breakdown

### Component Weights
| Component | Weight | Description |
|-----------|--------|-------------|
| Interests | 40% | Shared hobbies and interests |
| Values | 30% | Core values and principles |
| Location | 20% | Geographic proximity |
| Age | 10% | Age compatibility |

### Calculation Details

#### 1. Interests Match (40%)
```javascript
// Calculates overlap between interests arrays
const commonInterests = profile1.interests.filter(i => 
  profile2.interests.includes(i)
);
const score = (commonInterests.length / Math.max(
  profile1.interests.length,
  profile2.interests.length
)) * 100;
```

**Example:**
- Profile 1: ["technology", "hiking", "reading", "coffee"]
- Profile 2: ["technology", "hiking", "photography", "travel"]
- Common: ["technology", "hiking"] = 2 interests
- Max length: 4
- Score: (2/4) * 100 = 50%
- Weighted: 50% * 0.4 = 20 points

#### 2. Values Match (30%)
```javascript
// Same calculation as interests but for values
const commonValues = profile1.values.filter(v => 
  profile2.values.includes(v)
);
const score = (commonValues.length / Math.max(
  profile1.values.length,
  profile2.values.length
)) * 100;
```

**Example:**
- Profile 1: ["honesty", "ambition", "kindness", "humor"]
- Profile 2: ["honesty", "ambition", "adventure", "humor"]
- Common: ["honesty", "ambition", "humor"] = 3 values
- Max length: 4
- Score: (3/4) * 100 = 75%
- Weighted: 75% * 0.3 = 22.5 points

#### 3. Location Match (20%)
```javascript
// Parses location strings and compares
if (sameCity) return 100;
if (sameState) return 50;
return 0;
```

**Examples:**
- Same city: "San Francisco, CA" = "San Francisco, CA" → 100%
- Same state: "San Francisco, CA" = "Los Angeles, CA" → 50%
- Different state: "San Francisco, CA" = "New York, NY" → 0%

**Weighted:**
- Same city: 100% * 0.2 = 20 points
- Same state: 50% * 0.2 = 10 points
- Different: 0% * 0.2 = 0 points

#### 4. Age Compatibility (10%)
```javascript
const ageDiff = Math.abs(profile1.age - profile2.age);
if (ageDiff <= 2) return 100;
if (ageDiff <= 5) return 75;
if (ageDiff <= 10) return 50;
return 25;
```

**Examples:**
- 28 and 29 (diff: 1) → 100% → 10 points
- 28 and 32 (diff: 4) → 75% → 7.5 points
- 28 and 35 (diff: 7) → 50% → 5 points
- 28 and 45 (diff: 17) → 25% → 2.5 points

### Total Text-Based Score Example

**Profile 1:** Alice, 28, San Francisco
- Interests: ["technology", "hiking", "reading", "coffee"]
- Values: ["honesty", "ambition", "kindness", "humor"]

**Profile 2:** Bob, 30, San Francisco
- Interests: ["technology", "hiking", "photography", "travel"]
- Values: ["honesty", "ambition", "adventure", "humor"]

**Calculation:**
1. Interests: 50% → 50 * 0.4 = **20 points**
2. Values: 75% → 75 * 0.3 = **22.5 points**
3. Location: Same city → 100 * 0.2 = **20 points**
4. Age: 2 years diff → 100 * 0.1 = **10 points**

**Total Text-Based Score: 72.5** (Good Match)

---

## 🌐 URL-Based Matching

### Process Flow

1. **Extract URLs**
   ```javascript
   const userUrls = [profile.personal_website, ...profile.social_links];
   ```

2. **Fetch Content**
   - Uses Cheerio to scrape web pages
   - Extracts text, links, and metadata
   - Aggregates content from all URLs

3. **AI Analysis**
   ```javascript
   const prompt = `
   Analyze this person's digital footprint and determine compatibility.
   
   Person 1 Profile: ${JSON.stringify(profile1)}
   Person 1 Content: ${content1}
   
   Person 2 Profile: ${JSON.stringify(profile2)}
   Person 2 Content: ${content2}
   `;
   ```

4. **Gemini AI Response**
   - Analyzes personalities from content
   - Identifies interests and values
   - Calculates compatibility score (0-100)
   - Provides reasoning

### URL Context Scoring

The AI considers:
- Writing style and communication
- Professional background
- Personal interests from content
- Values expressed in writing
- Life goals and aspirations
- Personality indicators

**Example AI Response:**
```json
{
  "score": 78,
  "reasoning": "Both profiles show strong technical backgrounds with shared interests in software development. Person 1's blog posts about work-life balance align well with Person 2's values. Photography hobby overlap is evident from their portfolios.",
  "strengths": [
    "Technical compatibility",
    "Shared creative interests",
    "Similar communication styles"
  ],
  "concerns": [
    "Different career stages might affect availability"
  ]
}
```

---

## 🎨 Combined Scoring

### When Both Available

**Formula:**
```javascript
overall = (textScore * 0.4) + (urlScore * 0.6)
```

**Example:**
- Text Score: 72.5
- URL Score: 78
- Combined: (72.5 * 0.4) + (78 * 0.6) = 29 + 46.8 = **75.8**

### Recommendation Logic

```javascript
if (score >= 80) return 'excellent_match';
if (score >= 60) return 'good_match';
if (score >= 40) return 'moderate_match';
return 'low_match';
```

---

## 📈 Scoring Examples

### Example 1: High Compatibility
**Text Score:** 85
**URL Score:** 88
**Combined:** 86.9
**Recommendation:** Excellent Match

**Breakdown:**
- Interests: 80% (many shared interests)
- Values: 90% (strong value alignment)
- Location: 100% (same city)
- Age: 100% (1 year difference)
- URL Context: 88% (similar backgrounds, compatible goals)

---

### Example 2: Moderate Compatibility
**Text Score:** 45
**URL Score:** 52
**Combined:** 49.2
**Recommendation:** Moderate Match

**Breakdown:**
- Interests: 30% (few shared interests)
- Values: 50% (some value alignment)
- Location: 50% (same state)
- Age: 75% (4 years difference)
- URL Context: 52% (different but not incompatible)

---

### Example 3: Low Compatibility
**Text Score:** 25
**URL Score:** N/A (no URLs)
**Combined:** 25
**Recommendation:** Low Match

**Breakdown:**
- Interests: 10% (no shared interests)
- Values: 25% (minimal value alignment)
- Location: 0% (different states)
- Age: 25% (15 years difference)

---

## 🔍 Match Score Interpretation

| Score | Category | Meaning |
|-------|----------|---------|
| 80-100 | Excellent | Highly compatible, strong potential |
| 60-79 | Good | Compatible in most areas |
| 40-59 | Moderate | Some compatibility, worth exploring |
| 0-39 | Low | Limited compatibility |

---

## 💡 Optimization Tips

### For Better Text-Based Scores
1. Complete profile thoroughly
2. List multiple interests (5-10 recommended)
3. Define clear values (3-6 recommended)
4. Provide accurate location
5. Keep age realistic

### For Better URL-Based Scores
1. Provide personal website
2. Link to professional profiles (LinkedIn, GitHub)
3. Include blog or portfolio
4. Ensure URLs are accessible
5. Content should reflect your interests/values

---

## 🎯 Use Cases

### Use Case 1: User Finds Matches
```javascript
POST /api/users/find-matches
{
  "user_id": "user-123",
  "include_url_matching": true,
  "limit": 10
}
```

Returns top 10 matches sorted by overall score.

### Use Case 2: Application Auto-Matching
```javascript
POST /api/applications/date-me-doc-slug
{
  "applicant_email": "user@example.com",
  "submitted_links": {
    "linkedin": "https://linkedin.com/in/user"
  }
}
```

System automatically calculates match score between applicant and doc owner.

### Use Case 3: Manual Match Calculation
```javascript
POST /api/users/match-application
{
  "application_id": "app-123",
  "include_url_matching": true
}
```

Manually triggers match calculation with URL analysis.

---

## 📊 Database Storage

### matchmaking_scores Table
```sql
{
  application_id: UUID,
  doc_owner_id: UUID,
  applicant_id: UUID,
  text_match_score: NUMERIC,      -- 0-100
  url_context_score: NUMERIC,     -- 0-100 or NULL
  overall_score: NUMERIC,         -- 0-100
  compatibility_breakdown: JSONB, -- Detailed breakdown
  recommendation: TEXT            -- excellent/good/moderate/low
}
```

---

## 🚀 Performance Considerations

- Text-based matching: ~50ms
- URL-based matching: ~2-5 seconds (depends on URL count and content size)
- AI analysis: ~1-3 seconds per comparison
- Database query: ~100ms

**Total for full match:** ~3-8 seconds

---

*This algorithm provides a balanced approach to matchmaking, combining quantifiable metrics with AI-powered personality analysis.*
