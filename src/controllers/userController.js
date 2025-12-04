import supabaseAdmin from '../db/supabase.js';
import contentExtractor from '../services/contentExtractor.js';
import psychologicalAnalyzer from '../services/psychologicalAnalyzer.js';

class UserController {
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
        return res.status(500).json({
          error: 'Analysis failed',
          details: result.error
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
        return res.status(500).json({
          error: 'Compatibility calculation failed',
          details: result.error
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
}

export default new UserController();
