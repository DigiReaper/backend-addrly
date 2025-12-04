import OpenAI from 'openai';

class PsychologicalAnalyzer {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.model = process.env.OPENAI_MODEL || 'gpt-4-turbo-preview';
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

Provide a detailed analysis in the following JSON format:
{
  "personality_traits": {
    "openness": <0-1 score>,
    "conscientiousness": <0-1 score>,
    "extraversion": <0-1 score>,
    "agreeableness": <0-1 score>,
    "neuroticism": <0-1 score>
  },
  "communication_style": {
    "primary_style": "<analytical|emotional|casual|formal|humorous>",
    "tone": "<enthusiastic|reserved|balanced|passionate>",
    "vocabulary_level": "<simple|moderate|sophisticated>",
    "authenticity_score": <0-1>
  },
  "interests": [
    "<list of interests extracted from content>"
  ],
  "passions": [
    "<deep passions and things they care about>"
  ],
  "values": [
    "<core values like freedom, family, career, creativity, etc>"
  ],
  "thinking_style": "<analytical|creative|practical|philosophical>",
  "humor_type": "<sarcastic|witty|dark|wholesome|dry|none>",
  "emotional_intelligence": {
    "self_awareness": <0-1 score>,
    "empathy": <0-1 score>,
    "emotional_expression": <0-1 score>
  },
  "social_orientation": "<introverted|extroverted|ambiverted>",
  "lifestyle_indicators": {
    "activity_level": "<sedentary|moderate|active>",
    "cultural_engagement": "<low|moderate|high>",
    "intellectual_curiosity": "<low|moderate|high>",
    "spontaneity": "<planned|balanced|spontaneous>"
  },
  "relationship_indicators": {
    "attachment_style": "<secure|anxious|avoidant|mixed>",
    "commitment_readiness": "<low|moderate|high>",
    "emotional_availability": "<low|moderate|high>"
  },
  "red_flags": [
    "<any concerning patterns or behaviors>"
  ],
  "green_flags": [
    "<positive indicators for relationships>"
  ],
  "conversation_topics": [
    "<topics they would enjoy discussing>"
  ],
  "life_stage": "<student|early_career|established|seeking_change>",
  "overall_summary": "<2-3 sentence summary of the person>"
}

Be thorough, nuanced, and base your analysis on concrete evidence from the text. Assign realistic scores between 0 and 1.`;

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert psychologist specializing in personality analysis and compatibility assessment. Provide detailed, evidence-based insights in valid JSON format only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });

      const analysis = JSON.parse(response.choices[0].message.content);
      
      return {
        success: true,
        profile: analysis,
        tokensUsed: response.usage.total_tokens,
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

Provide a comprehensive compatibility analysis in the following JSON format:
{
  "overall_compatibility_score": <0-100>,
  "confidence_level": <0-1>,
  "compatibility_breakdown": {
    "personality_match": <0-100>,
    "interests_overlap": <0-100>,
    "values_alignment": <0-100>,
    "communication_compatibility": <0-100>,
    "lifestyle_compatibility": <0-100>,
    "intellectual_compatibility": <0-100>,
    "emotional_compatibility": <0-100>,
    "humor_compatibility": <0-100>
  },
  "matching_factors": {
    "shared_interests": ["<list>"],
    "complementary_traits": ["<list>"],
    "similar_values": ["<list>"],
    "compatible_communication": "<explanation>"
  },
  "conversation_potential": {
    "score": <0-100>,
    "topics": ["<topics they can bond over>"],
    "depth_potential": "<shallow|moderate|deep>"
  },
  "relationship_potential": {
    "friendship": <0-100>,
    "romantic": <0-100>,
    "long_term": <0-100>
  },
  "red_flags": [
    {
      "flag": "<description>",
      "severity": "<low|medium|high>",
      "explanation": "<why this matters>"
    }
  ],
  "green_flags": [
    {
      "flag": "<description>",
      "strength": "<medium|high>",
      "explanation": "<why this is positive>"
    }
  ],
  "areas_of_growth": [
    "<potential challenges they might face>"
  ],
  "date_ideas": [
    "<activities they would both enjoy>"
  ],
  "recommendation": "<strong_match|good_potential|moderate_match|poor_match>",
  "summary": "<3-4 sentence summary of compatibility>",
  "conversation_starters": [
    "<topics or questions they could discuss>"
  ]
}

Be honest, nuanced, and evidence-based. Consider both compatibility and complementarity.`;

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert matchmaker and relationship counselor. Provide detailed, honest compatibility assessments in valid JSON format only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });

      const compatibility = JSON.parse(response.choices[0].message.content);
      
      return {
        success: true,
        compatibility,
        tokensUsed: response.usage.total_tokens,
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

Provide analysis in JSON format:
{
  "preference_match_score": <0-100>,
  "answer_quality_score": <0-100>,
  "authenticity_score": <0-100>,
  "effort_score": <0-100>,
  "preference_matches": [
    {
      "preference": "<preference name>",
      "matched": <boolean>,
      "explanation": "<how well they match>"
    }
  ],
  "standout_answers": [
    {
      "question": "<question>",
      "answer": "<answer>",
      "why_standout": "<explanation>"
    }
  ],
  "concerning_answers": [
    {
      "question": "<question>",
      "answer": "<answer>",
      "concern": "<explanation>"
    }
  ],
  "overall_impression": "<positive|neutral|negative>",
  "recommendation": "<highly_recommend|recommend|consider|pass>",
  "summary": "<brief summary of the application>"
}`;

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert at evaluating dating applications. Provide honest, detailed assessments in valid JSON format only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });

      const analysis = JSON.parse(response.choices[0].message.content);
      
      return {
        success: true,
        analysis,
        tokensUsed: response.usage.total_tokens,
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
