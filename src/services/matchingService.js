import psychologicalAnalyzer from './psychologicalAnalyzer.js';
import contentExtractor from './contentExtractor.js';

class MatchingService {
  /**
   * Calculate text-based match score
   */
  calculateTextMatchScore(profile1, profile2) {
    let score = 0;
    let maxScore = 0;

    // Interest matching (40 points)
    const interests1 = new Set(profile1.interests || []);
    const interests2 = new Set(profile2.interests || []);
    const commonInterests = [...interests1].filter(i => interests2.has(i));
    const interestScore = (commonInterests.length / Math.max(interests1.size, interests2.size, 1)) * 40;
    score += interestScore;
    maxScore += 40;

    // Values matching (30 points)
    const values1 = new Set(profile1.values || []);
    const values2 = new Set(profile2.values || []);
    const commonValues = [...values1].filter(v => values2.has(v));
    const valuesScore = (commonValues.length / Math.max(values1.size, values2.size, 1)) * 30;
    score += valuesScore;
    maxScore += 30;

    // Location proximity (20 points)
    if (profile1.location && profile2.location) {
      if (profile1.location.toLowerCase() === profile2.location.toLowerCase()) {
        score += 20;
      } else if (profile1.location.toLowerCase().includes(profile2.location.toLowerCase()) ||
                 profile2.location.toLowerCase().includes(profile1.location.toLowerCase())) {
        score += 10;
      }
    }
    maxScore += 20;

    // Age compatibility (10 points)
    if (profile1.age && profile2.age) {
      const ageDiff = Math.abs(profile1.age - profile2.age);
      if (ageDiff <= 5) score += 10;
      else if (ageDiff <= 10) score += 5;
    }
    maxScore += 10;

    return Math.round((score / maxScore) * 100);
  }

  /**
   * Calculate URL-based context match score
   */
  async calculateUrlContextScore(profile1Urls, profile2Urls) {
    try {
      // Extract content from URLs
      const content1 = await this.extractAndAggregateContent(profile1Urls);
      const content2 = await this.extractAndAggregateContent(profile2Urls);

      if (!content1.success || !content2.success) {
        return { score: 0, reason: 'Failed to extract content' };
      }

      // Analyze psychological profiles
      const analysis1 = await psychologicalAnalyzer.analyzePsychologicalProfile(
        { texts: content1.texts },
        { totalLength: content1.totalLength }
      );

      const analysis2 = await psychologicalAnalyzer.analyzePsychologicalProfile(
        { texts: content2.texts },
        { totalLength: content2.totalLength }
      );

      if (!analysis1.success || !analysis2.success) {
        return { score: 0, reason: 'Failed to analyze profiles' };
      }

      // Calculate compatibility
      const compatibility = await psychologicalAnalyzer.calculateCompatibility(
        analysis1.profile,
        analysis2.profile
      );

      if (!compatibility.success) {
        return { score: 0, reason: 'Failed to calculate compatibility' };
      }

      return {
        score: compatibility.compatibility.overall_compatibility_score || 0,
        details: compatibility.compatibility
      };
    } catch (error) {
      console.error('URL context matching error:', error);
      return { score: 0, reason: error.message };
    }
  }

  /**
   * Extract and aggregate content from multiple URLs
   */
  async extractAndAggregateContent(urls) {
    if (!urls || urls.length === 0) {
      return { success: false, reason: 'No URLs provided' };
    }

    const texts = [];
    let totalLength = 0;

    for (const url of urls) {
      try {
        const result = await contentExtractor.extractFromUrl(url);
        if (result.success && result.data) {
          const content = result.data.mainContent || result.data.bio || '';
          if (content) {
            texts.push(content);
            totalLength += content.length;
          }
        }
      } catch (error) {
        console.error(`Error extracting from ${url}:`, error);
      }
    }

    return {
      success: texts.length > 0,
      texts,
      totalLength
    };
  }

  /**
   * Comprehensive matching
   */
  async matchProfiles(profile1, profile2, options = {}) {
    const results = {
      text_match_score: 0,
      url_context_score: 0,
      overall_score: 0,
      breakdown: {}
    };

    // Text-based matching
    results.text_match_score = this.calculateTextMatchScore(profile1, profile2);
    results.breakdown.text_based = {
      score: results.text_match_score,
      method: 'Interest, values, location, and age matching'
    };

    // URL-based matching (if URLs provided)
    if (options.includeUrlMatching && 
        (profile1.urls?.length > 0 || profile2.urls?.length > 0)) {
      const urlResult = await this.calculateUrlContextScore(
        profile1.urls || [],
        profile2.urls || []
      );
      results.url_context_score = urlResult.score;
      results.breakdown.url_based = urlResult;
    }

    // Calculate overall score (weighted average)
    const textWeight = options.includeUrlMatching ? 0.4 : 1.0;
    const urlWeight = options.includeUrlMatching ? 0.6 : 0.0;
    
    results.overall_score = Math.round(
      (results.text_match_score * textWeight) + 
      (results.url_context_score * urlWeight)
    );

    // Add recommendation
    if (results.overall_score >= 80) {
      results.recommendation = 'excellent_match';
    } else if (results.overall_score >= 60) {
      results.recommendation = 'good_match';
    } else if (results.overall_score >= 40) {
      results.recommendation = 'moderate_match';
    } else {
      results.recommendation = 'low_match';
    }

    return results;
  }
}

export default new MatchingService();
