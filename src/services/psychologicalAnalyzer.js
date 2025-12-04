import { GoogleGenerativeAI } from '@google/generative-ai';

class PsychologicalAnalyzer {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ 
      model: process.env.GEMINI_MODEL || 'gemini-pro'
    });
  }

  /**
   * Analyze personality and psychological profile from text content
   */
  async analyzePsychologicalProfile(content, metadata = {}) {
    try {
      const prompt = `You are an expert psychologist and personality analyst. Analyze the following content written by or about a person and provide a comprehensive psychological profile.

Content to analyze:
${content.substring(0, 15000)}

${metadata.sources ? `\nSources: ${metadata.sources.map(s => `${s.type}: ${s.url}`).join(', ')}` : ''}

Provide a detailed analysis in the following JSON format (return ONLY valid JSON, no markdown):
{
  "personality_traits": {
    "openness": 0.8,
    "conscientiousness": 0.7,
    "extraversion": 0.6,
    "agreeableness": 0.75,
    "neuroticism": 0.3
  },
  "communication_style": {
    "primary_style": "analytical",
    "tone": "enthusiastic",
    "vocabulary_level": "sophisticated",
    "authenticity_score": 0.85
  },
  "interests": ["tech", "reading", "travel"],
  "passions": ["building products", "learning"],
  "values": ["freedom", "creativity", "growth"],
  "thinking_style": "analytical",
  "humor_type": "witty",
  "emotional_intelligence": {
    "self_awareness": 0.8,
    "empathy": 0.75,
    "emotional_expression": 0.7
  },
  "social_orientation": "ambiverted",
  "lifestyle_indicators": {
    "activity_level": "active",
    "cultural_engagement": "high",
    "intellectual_curiosity": "high",
    "spontaneity": "balanced"
  },
  "relationship_indicators": {
    "attachment_style": "secure",
    "commitment_readiness": "high",
    "emotional_availability": "high"
  },
  "red_flags": [],
  "green_flags": ["authentic communication", "growth mindset"],
  "conversation_topics": ["technology", "philosophy", "startups"],
  "life_stage": "early_career",
  "overall_summary": "A thoughtful individual with strong analytical skills and genuine curiosity about the world."
}

Be thorough, nuanced, and base your analysis on concrete evidence from the text. Assign realistic scores between 0 and 1. Return ONLY the JSON object, no other text.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Clean up markdown formatting if present
      const jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const analysis = JSON.parse(jsonText);
      
      return {
        success: true,
        profile: analysis,
        analyzedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Psychological analysis error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Calculate compatibility between two psychological profiles
   */
  async calculateCompatibility(profile1, profile2, preferences = {}) {
    try {
      const prompt = `You are an expert relationship counselor and matchmaker. Analyze the compatibility between two people based on their psychological profiles.

Person 1 Profile:
${JSON.stringify(profile1, null, 2)}

Person 2 Profile:
${JSON.stringify(profile2, null, 2)}

${preferences && Object.keys(preferences).length > 0 ? `\nPerson 1's stated preferences:\n${JSON.stringify(preferences, null, 2)}` : ''}

Provide a comprehensive compatibility analysis in JSON format (return ONLY valid JSON, no markdown):
{
  "overall_compatibility_score": 85,
  "confidence_level": 0.8,
  "compatibility_breakdown": {
    "personality_match": 80,
    "interests_overlap": 90,
    "values_alignment": 85,
    "communication_compatibility": 88,
    "lifestyle_compatibility": 75,
    "intellectual_compatibility": 87,
    "emotional_compatibility": 82,
    "humor_compatibility": 78
  },
  "matching_factors": {
    "shared_interests": ["tech", "reading"],
    "complementary_traits": ["analytical and creative"],
    "similar_values": ["growth", "authenticity"],
    "compatible_communication": "Both value deep conversations"
  },
  "conversation_potential": {
    "score": 88,
    "topics": ["technology", "philosophy", "personal growth"],
    "depth_potential": "deep"
  },
  "relationship_potential": {
    "friendship": 90,
    "romantic": 85,
    "long_term": 82
  },
  "red_flags": [],
  "green_flags": [
    {
      "flag": "Strong intellectual compatibility",
      "strength": "high",
      "explanation": "Both value learning and deep conversations"
    }
  ],
  "areas_of_growth": ["Different activity levels might need balance"],
  "date_ideas": ["Coffee shop discussion", "Museum visit", "Hiking"],
  "recommendation": "strong_match",
  "summary": "Excellent compatibility with strong intellectual and emotional connection.",
  "conversation_starters": ["Favorite books", "Current projects", "Life philosophy"]
}

Be honest, nuanced, and evidence-based. Return ONLY the JSON object, no other text.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const compatibility = JSON.parse(jsonText);
      
      return {
        success: true,
        compatibility,
        analyzedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Compatibility analysis error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Analyze if application answers match date-me-doc preferences
   */
  async analyzeApplicationMatch(docPreferences, docOwnerProfile, applicationAnswers, applicantProfile) {
    try {
      const prompt = `Analyze how well an application matches the date-me-doc creator's preferences and questions.

Date-Me-Doc Owner's Profile:
${JSON.stringify(docOwnerProfile, null, 2)}

Date-Me-Doc Owner's Preferences:
${JSON.stringify(docPreferences, null, 2)}

Applicant's Profile:
${JSON.stringify(applicantProfile, null, 2)}

Applicant's Answers:
${JSON.stringify(applicationAnswers, null, 2)}

Provide analysis in JSON format (return ONLY valid JSON, no markdown):
{
  "preference_match_score": 85,
  "answer_quality_score": 90,
  "authenticity_score": 88,
  "effort_score": 92,
  "preference_matches": [
    {
      "preference": "interests",
      "matched": true,
      "explanation": "Strong overlap in technology and reading"
    }
  ],
  "standout_answers": [
    {
      "question": "Tell me about yourself",
      "answer": "The answer text",
      "why_standout": "Authentic and thoughtful response"
    }
  ],
  "concerning_answers": [],
  "overall_impression": "positive",
  "recommendation": "highly_recommend",
  "summary": "Excellent application with thoughtful answers and strong compatibility."
}

Return ONLY the JSON object, no other text.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const analysis = JSON.parse(jsonText);
      
      return {
        success: true,
        analysis,
        analyzedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Application match analysis error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default new PsychologicalAnalyzer();
