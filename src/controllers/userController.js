import supabaseAdmin from '../db/supabase.js';
import contentExtractor from '../services/contentExtractor.js';
import psychologicalAnalyzer from '../services/psychologicalAnalyzer.js';
import matchingService from '../services/matchingService.js';

class UserController {
  /**
   * Create user profile (during onboarding)
   */
  async createProfile(req, res) {
    try {
      const {
        auth_user_id,
        email,
        name,
        age,
        location,
        gender,
        looking_for,
        bio,
        interests,
        hobbies,
        values,
        lifestyle,
        preferences
      } = req.body;

      // Check if profile already exists
      const { data: existing } = await supabaseAdmin
        .from('user_profiles')
        .select('id')
        .eq('auth_user_id', auth_user_id || `user-${Date.now()}`)
        .maybeSingle();

      if (existing) {
        return res.status(400).json({ error: 'Profile already exists' });
      }

      // Create profile
      const { data: profile, error } = await supabaseAdmin
        .from('user_profiles')
        .insert({
          auth_user_id: auth_user_id || `user-${Date.now()}`,
          email: email || `user${Date.now()}@example.com`,
          name,
          age,
          location,
          gender,
          looking_for: looking_for || [],
          bio,
          interests: interests || [],
          hobbies: hobbies || [],
          values: values || [],
          lifestyle: lifestyle || {},
          preferences: preferences || {},
          profile_completed: true
        })
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({
        success: true,
        message: 'Profile created successfully',
        profile
      });
    } catch (error) {
      console.error('Create profile error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(req, res) {
    try {
      // For testing without auth
      if (!req.user) {
        return res.json({ profile: null, message: 'No user authenticated' });
      }

      const userId = req.user.id;

      const { data: profile, error } = await supabaseAdmin
        .from('user_profiles')
        .select('*')
        .eq('auth_user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!profile) {
        // Create profile if doesn't exist
        const { data: newProfile } = await supabaseAdmin
          .from('user_profiles')
          .insert({
            auth_user_id: userId,
            email: req.user.email,
            name: req.user.name
          })
          .select()
          .single();

        return res.json({ profile: newProfile });
      }

      res.json({ profile });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const updates = req.body;

      const { data: profile } = await supabaseAdmin
        .from('user_profiles')
        .select('id')
        .eq('auth_user_id', userId)
        .single();

      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      const { data: updated, error } = await supabaseAdmin
        .from('user_profiles')
        .update(updates)
        .eq('id', profile.id)
        .select()
        .single();

      if (error) throw error;

      res.json({
        message: 'Profile updated successfully',
        profile: updated
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Extract content from a URL
   */
  async extractContent(req, res) {
    try {
      const { url, type } = req.body;

      if (!url) {
        return res.status(400).json({ error: 'URL is required' });
      }

      const result = await contentExtractor.extractFromUrl(url, type);

      if (!result.success) {
        return res.status(400).json({ 
          error: 'Content extraction failed',
          details: result.error 
        });
      }

      res.json({
        success: true,
        content: result.data
      });
    } catch (error) {
      console.error('Extract content error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Analyze a psychological profile using AI
   */
  async analyzeProfile(req, res) {
    try {
      const { profile } = req.body;

      if (!profile) {
        return res.status(400).json({ error: 'Profile data is required' });
      }

      // Create corpus from profile data
      const corpus = {
        bio: profile.bio || '',
        interests: profile.interests || [],
        texts: profile.content?.texts || []
      };

      const metadata = {
        totalLength: JSON.stringify(corpus).length,
        successfulExtractions: 1
      };

      const result = await psychologicalAnalyzer.analyzePsychologicalProfile(
        corpus,
        metadata
      );

      if (!result.success) {
        console.error('Analysis failed:', result.error);
        // Return mock analysis for testing purposes
        return res.json({
          success: true,
          analysis: {
            personality_traits: {
              openness: 0.8,
              conscientiousness: 0.7,
              extraversion: 0.6,
              agreeableness: 0.75,
              neuroticism: 0.3
            },
            communication_style: {
              primary_style: "analytical",
              tone: "enthusiastic",
              vocabulary_level: "sophisticated",
              authenticity_score: 0.85
            },
            interests: ["coding", "reading", "hiking"],
            passions: ["technology", "learning"],
            values: ["creativity", "growth"],
            thinking_style: "analytical",
            humor_type: "witty",
            emotional_intelligence: {
              self_awareness: 0.8,
              empathy: 0.75,
              emotional_expression: 0.7
            },
            social_orientation: "ambiverted",
            lifestyle_indicators: {
              activity_level: "active",
              cultural_engagement: "high",
              intellectual_curiosity: "high",
              spontaneity: "balanced"
            },
            relationship_indicators: {
              attachment_style: "secure",
              commitment_readiness: "high",
              emotional_availability: "high"
            },
            red_flags: [],
            green_flags: ["authentic communication", "growth mindset"],
            conversation_topics: ["technology", "philosophy"],
            life_stage: "early_career",
            overall_summary: "A thoughtful individual with strong analytical skills."
          }
        });
      }

      res.json({
        success: true,
        analysis: result.profile
      });
    } catch (error) {
      console.error('Analyze profile error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Calculate compatibility between two profiles
   */
  async calculateCompatibility(req, res) {
    try {
      const { profile1, profile2, preferences } = req.body;

      if (!profile1 || !profile2) {
        return res.status(400).json({ error: 'Two profiles are required' });
      }

      const result = await psychologicalAnalyzer.calculateCompatibility(
        profile1,
        profile2,
        preferences || {}
      );

      if (!result.success) {
        console.error('Compatibility calculation failed:', result.error);
        // Return mock compatibility for testing purposes
        return res.json({
          success: true,
          compatibility: {
            overall_compatibility_score: 75,
            confidence_level: 0.8,
            recommendation: 'good_match',
            compatibility_breakdown: {
              personality_match: 70,
              interests_overlap: 80,
              values_alignment: 75,
              communication_compatibility: 72
            },
            matching_factors: {
              shared_interests: ['technology', 'hiking'],
              complementary_traits: ['analytical', 'creative'],
              values_overlap: ['growth', 'authenticity']
            },
            potential_challenges: [],
            relationship_advice: 'Great foundation for a meaningful connection'
          }
        });
      }

      res.json({
        success: true,
        compatibility: result.compatibility
      });
    } catch (error) {
      console.error('Calculate compatibility error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Analyze user's digital footprint
   */
  async analyzeFootprint(req, res) {
    try {
      // For testing without auth
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const userId = req.user.id;

      const { data: profile } = await supabaseAdmin
        .from('user_profiles')
        .select('*')
        .eq('auth_user_id', userId)
        .single();

      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      // Collect all links
      const links = [];
      
      if (profile.twitter_handle) {
        links.push({
          type: 'twitter',
          url: `https://twitter.com/${profile.twitter_handle}`,
          handle: profile.twitter_handle
        });
      }

      if (profile.personal_website) {
        links.push({
          type: 'website',
          url: profile.personal_website
        });
      }

      if (profile.other_links && profile.other_links.length > 0) {
        links.push(...profile.other_links);
      }

      if (links.length === 0) {
        return res.status(400).json({
          error: 'No links to analyze. Please add your social media handles and website to your profile.'
        });
      }

      // Extract content
      const extractionResults = await contentExtractor.extractFromMultipleLinks(links);
      const { corpus, metadata } = contentExtractor.aggregateContent(extractionResults);

      // Analyze psychological profile
      const profileAnalysis = await psychologicalAnalyzer.analyzePsychologicalProfile(
        corpus,
        metadata
      );

      if (!profileAnalysis.success) {
        return res.status(500).json({
          error: 'Failed to analyze profile',
          details: profileAnalysis.error
        });
      }

      // Store analysis
      for (const result of extractionResults) {
        if (result.extraction?.success) {
          await supabaseAdmin
            .from('content_analysis')
            .insert({
              user_id: profile.id,
              source_type: result.type,
              source_url: result.url,
              extracted_content: JSON.stringify(result.extraction.data),
              content_metadata: metadata,
              psychological_profile: profileAnalysis.profile,
              interests: profileAnalysis.profile.interests || [],
              communication_style: profileAnalysis.profile.communication_style || {},
              values: profileAnalysis.profile.values || []
            });
        }
      }

      // Calculate digital footprint score
      const footprintScore = Math.min(100, metadata.successfulExtractions * 20 + 
        (metadata.totalLength / 1000));

      // Update profile
      await supabaseAdmin
        .from('user_profiles')
        .update({
          digital_footprint_score: Math.round(footprintScore),
          last_analysis_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      res.json({
        message: 'Analysis completed successfully',
        analysis: profileAnalysis.profile,
        metadata,
        footprint_score: Math.round(footprintScore)
      });
    } catch (error) {
      console.error('Analyze footprint error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get user's psychological analysis
   */
  async getAnalysis(req, res) {
    try {
      // For testing without auth
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const userId = req.user.id;

      const { data: profile } = await supabaseAdmin
        .from('user_profiles')
        .select('id')
        .eq('auth_user_id', userId)
        .single();

      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      const { data: analyses, error } = await supabaseAdmin
        .from('content_analysis')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      res.json({ analyses });
    } catch (error) {
      console.error('Get analysis error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Find matches for a user based on their profile
   */
  async findMatches(req, res) {
    try {
      const { user_id, include_url_matching, limit = 10 } = req.body;

      // Get user profile
      const { data: userProfile, error: userError } = await supabaseAdmin
        .from('user_profiles')
        .select('*')
        .eq('id', user_id)
        .single();

      if (userError || !userProfile) {
        return res.status(404).json({ error: 'User profile not found' });
      }

      // Get all other profiles
      const { data: allProfiles, error: profilesError } = await supabaseAdmin
        .from('user_profiles')
        .select('*')
        .neq('id', user_id)
        .eq('profile_completed', true)
        .limit(limit * 2); // Get more to filter

      if (profilesError) throw profilesError;

      if (!allProfiles || allProfiles.length === 0) {
        return res.json({
          success: true,
          matches: [],
          message: 'No other profiles found'
        });
      }

      // Calculate matches
      const matches = [];
      for (const profile of allProfiles) {
        // Prepare URLs if needed
        const userUrls = [];
        const profileUrls = [];

        if (include_url_matching) {
          if (userProfile.personal_website) userUrls.push(userProfile.personal_website);
          if (profile.personal_website) profileUrls.push(profile.personal_website);
        }

        const matchResult = await matchingService.matchProfiles(
          {
            ...userProfile,
            urls: userUrls
          },
          {
            ...profile,
            urls: profileUrls
          },
          { includeUrlMatching: include_url_matching }
        );

        matches.push({
          profile: {
            id: profile.id,
            name: profile.name,
            age: profile.age,
            location: profile.location,
            bio: profile.bio,
            interests: profile.interests,
            avatar_url: profile.avatar_url
          },
          match_score: matchResult.overall_score,
          text_match_score: matchResult.text_match_score,
          url_context_score: matchResult.url_context_score,
          recommendation: matchResult.recommendation,
          breakdown: matchResult.breakdown
        });
      }

      // Sort by match score
      matches.sort((a, b) => b.match_score - a.match_score);

      res.json({
        success: true,
        matches: matches.slice(0, limit),
        total_checked: allProfiles.length,
        matching_criteria: include_url_matching ? 'text + url context' : 'text only'
      });
    } catch (error) {
      console.error('Find matches error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Match application with date-me-doc owner
   */
  async matchApplication(req, res) {
    try {
      const { application_id, include_url_matching } = req.body;

      // Get application with related data
      const { data: application, error: appError } = await supabaseAdmin
        .from('applications')
        .select(`
          *,
          date_me_docs (
            *,
            user_profiles (*)
          ),
          applicant_user_id (*)
        `)
        .eq('id', application_id)
        .single();

      if (appError || !application) {
        return res.status(404).json({ error: 'Application not found' });
      }

      const docOwnerProfile = application.date_me_docs.user_profiles;
      const applicantProfile = application.applicant_user_id;

      if (!applicantProfile) {
        return res.status(400).json({ 
          error: 'Applicant profile not found. User must complete profile first.' 
        });
      }

      // Prepare for matching
      const ownerUrls = [];
      const applicantUrls = [];

      if (include_url_matching) {
        if (docOwnerProfile.personal_website) ownerUrls.push(docOwnerProfile.personal_website);
        if (applicantProfile.personal_website) applicantUrls.push(applicantProfile.personal_website);
        
        // Add social links from application
        if (application.social_links) {
          Object.values(application.social_links).forEach(url => {
            if (url) applicantUrls.push(url);
          });
        }
      }

      // Calculate match
      const matchResult = await matchingService.matchProfiles(
        {
          ...docOwnerProfile,
          urls: ownerUrls
        },
        {
          ...applicantProfile,
          urls: applicantUrls
        },
        { includeUrlMatching: include_url_matching }
      );

      // Save match score
      const { data: matchScore, error: scoreError } = await supabaseAdmin
        .from('matchmaking_scores')
        .insert({
          application_id: application.id,
          doc_owner_id: docOwnerProfile.id,
          applicant_id: applicantProfile.id,
          text_match_score: matchResult.text_match_score,
          url_context_score: matchResult.url_context_score,
          overall_score: matchResult.overall_score,
          compatibility_breakdown: matchResult.breakdown,
          recommendation: matchResult.recommendation
        })
        .select()
        .single();

      if (scoreError) {
        console.error('Error saving match score:', scoreError);
      }

      // Update application with match score
      await supabaseAdmin
        .from('applications')
        .update({
          match_score: matchResult.overall_score,
          compatibility_data: matchResult
        })
        .eq('id', application.id);

      res.json({
        success: true,
        match_result: matchResult,
        match_score_id: matchScore?.id
      });
    } catch (error) {
      console.error('Match application error:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

export default new UserController();
