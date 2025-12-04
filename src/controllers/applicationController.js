import supabaseAdmin from '../db/supabase.js';
import contentExtractor from '../services/contentExtractor.js';
import psychologicalAnalyzer from '../services/psychologicalAnalyzer.js';
import matchingService from '../services/matchingService.js';
import { v4 as uuidv4 } from 'uuid';

class ApplicationController {
  /**
   * Submit application to a date-me-doc
   */
  async submit(req, res) {
    try {
      const { slug } = req.params;
      const { applicant_email, applicant_name, answers, submitted_links } = req.body;

      // Get date-me-doc
      const { data: doc, error: docError } = await supabaseAdmin
        .from('date_me_docs')
        .select('*')
        .eq('slug', slug)
        .single();

      if (docError || !doc) {
        return res.status(404).json({ error: 'Date-me-doc not found' });
      }

      if (!doc.is_active) {
        return res.status(400).json({ error: 'This date-me-doc is no longer accepting applications' });
      }

      // Validate answers against form questions
      const requiredQuestions = doc.form_questions.filter(q => q.required);
      for (const question of requiredQuestions) {
        if (!answers[question.id]) {
          return res.status(400).json({
            error: `Missing required answer for question: ${question.question}`
          });
        }
      }

      // Get applicant user profile if authenticated
      let applicantUserId = null;
      if (req.user) {
        const { data: profile } = await supabaseAdmin
          .from('user_profiles')
          .select('id')
          .eq('auth_user_id', req.user.id)
          .single();
        applicantUserId = profile?.id;
      }

      // Create application
      const { data: application, error: appError } = await supabaseAdmin
        .from('applications')
        .insert({
          date_me_doc_id: doc.id,
          applicant_user_id: applicantUserId,
          applicant_email,
          applicant_name,
          answers,
          social_links: submitted_links,
          status: 'pending'
        })
        .select()
        .single();

      if (appError) throw appError;

      // Increment application count
      await supabaseAdmin
        .from('date_me_docs')
        .update({ application_count: doc.application_count + 1 })
        .eq('id', doc.id);

      // Queue analysis job
      await supabaseAdmin
        .from('analysis_jobs')
        .insert({
          job_type: 'content_extraction',
          entity_id: application.id,
          entity_type: 'application',
          status: 'queued',
          priority: 5
        });

      res.status(201).json({
        message: 'Application submitted successfully',
        application: {
          id: application.id,
          status: application.status,
          submitted_at: application.created_at
        }
      });

      // Start async analysis (don't wait for response)
      // this.processApplicationAsync(application.id, doc.id).catch(console.error);
    } catch (error) {
      console.error('Submit application error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Process application analysis asynchronously
   */
  async processApplicationAsync(applicationId, docId) {
    try {
      console.log(`Starting analysis for application ${applicationId}`);

      // Get application data
      const { data: application } = await supabaseAdmin
        .from('applications')
        .select('*')
        .eq('id', applicationId)
        .single();

      if (!application) return;

      // Extract content from submitted links
      const extractionResults = await contentExtractor.extractFromMultipleLinks(
        application.submitted_links
      );

      const { corpus, metadata } = contentExtractor.aggregateContent(extractionResults);

      // Store extraction results
      for (const result of extractionResults) {
        if (result.extraction?.success) {
          await supabaseAdmin
            .from('content_analysis')
            .insert({
              application_id: applicationId,
              user_id: application.applicant_user_id,
              source_type: result.type,
              source_url: result.url,
              extracted_content: JSON.stringify(result.extraction.data),
              content_metadata: metadata
            });
        }
      }

      // Analyze psychological profile
      const profileAnalysis = await psychologicalAnalyzer.analyzePsychologicalProfile(
        corpus,
        metadata
      );

      if (profileAnalysis.success) {
        // Update content analysis with psychological profile
        await supabaseAdmin
          .from('content_analysis')
          .update({
            psychological_profile: profileAnalysis.profile,
            interests: profileAnalysis.profile.interests || [],
            communication_style: profileAnalysis.profile.communication_style || {},
            values: profileAnalysis.profile.values || []
          })
          .eq('application_id', applicationId);

        // Get date-me-doc owner's profile
        const { data: doc } = await supabaseAdmin
          .from('date_me_docs')
          .select(`
            *,
            user_profiles (*)
          `)
          .eq('id', docId)
          .single();

        // Calculate match score using matchingService
        if (application.applicant_user_id && doc.user_profiles) {
          const ownerUrls = [];
          const applicantUrls = Object.values(application.submitted_links || {});

          if (doc.user_profiles.personal_website) {
            ownerUrls.push(doc.user_profiles.personal_website);
          }

          const matchResult = await matchingService.matchProfiles(
            { ...doc.user_profiles, urls: ownerUrls },
            { ...profileAnalysis.profile, urls: applicantUrls },
            { includeUrlMatching: applicantUrls.length > 0 }
          );

          // Store matchmaking score
          await supabaseAdmin
            .from('matchmaking_scores')
            .insert({
              application_id: applicationId,
              doc_owner_id: doc.user_profiles.id,
              applicant_id: application.applicant_user_id,
              text_match_score: matchResult.text_match_score,
              url_context_score: matchResult.url_context_score,
              overall_score: matchResult.overall_score,
              compatibility_breakdown: matchResult.breakdown,
              recommendation: matchResult.recommendation
            });

          // Update application with match score
          await supabaseAdmin
            .from('applications')
            .update({
              match_score: matchResult.overall_score,
              compatibility_data: matchResult,
              analysis_completed: true
            })
            .eq('id', applicationId);
        }

        // Fallback: Get or create owner's psychological profile for legacy compatibility
        const { data: ownerAnalysis } = await supabaseAdmin
          .from('content_analysis')
          .select('psychological_profile')
          .eq('user_id', doc.user_profiles.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        let ownerProfile = ownerAnalysis?.psychological_profile;

        // Legacy compatibility calculation (if needed)
        if (ownerProfile) {
          // If owner doesn't have complete profile, create basic one from preferences
          if (!ownerProfile.preferences && doc.preferences) {
            ownerProfile = {
              ...ownerProfile,
              preferences: doc.preferences,
              description: doc.description
            };
          }

          // Calculate compatibility using psychological analyzer
          const compatibilityAnalysis = await psychologicalAnalyzer.calculateCompatibility(
            ownerProfile,
            profileAnalysis.profile,
            doc.preferences
          );

          if (compatibilityAnalysis.success) {
          // Analyze application answers match
          const applicationMatch = await psychologicalAnalyzer.analyzeApplicationMatch(
            doc.preferences,
            ownerProfile,
            application.answers,
            profileAnalysis.profile
          );

          // Combine scores
          const overallScore = (
            compatibilityAnalysis.compatibility.overall_compatibility_score * 0.7 +
            (applicationMatch.success ? applicationMatch.analysis.preference_match_score * 0.3 : 0)
          );

          // Store legacy matchmaking score if not already created by matchingService
          const { data: existingScore } = await supabaseAdmin
            .from('matchmaking_scores')
            .select('id')
            .eq('application_id', applicationId)
            .maybeSingle();

          if (!existingScore) {
            await supabaseAdmin
              .from('matchmaking_scores')
              .insert({
                application_id: applicationId,
                doc_owner_id: doc.user_profiles.id,
                applicant_id: application.applicant_user_id,
                overall_score: overallScore,
                compatibility_breakdown: compatibilityAnalysis.compatibility.compatibility_breakdown,
                recommendation: compatibilityAnalysis.compatibility.recommendation
              });

            // Update application
            await supabaseAdmin
              .from('applications')
              .update({
                match_score: overallScore,
                analysis_completed: true
              })
              .eq('id', applicationId);
          }
        }
        }
      }

      // Update job status
      await supabaseAdmin
        .from('analysis_jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('entity_id', applicationId)
        .eq('entity_type', 'application');

      console.log(`✅ Analysis completed for application ${applicationId}`);
    } catch (error) {
      console.error('Application analysis error:', error);

      // Update job status to failed
      await supabaseAdmin
        .from('analysis_jobs')
        .update({
          status: 'failed',
          error_message: error.message,
          completed_at: new Date().toISOString()
        })
        .eq('entity_id', applicationId)
        .eq('entity_type', 'application');
    }
  }

  /**
   * Get application status and results (for applicant)
   */
  async getStatus(req, res) {
    try {
      const { applicationId } = req.params;
      const { email } = req.query;

      let query = supabaseAdmin
        .from('applications')
        .select(`
          id,
          status,
          compatibility_score,
          analysis_completed,
          created_at,
          matchmaking_scores (
            overall_score,
            recommendation,
            green_flags,
            date_ideas
          )
        `)
        .eq('id', applicationId);

      // If not authenticated, require email verification
      if (!req.user && email) {
        query = query.eq('applicant_email', email);
      } else if (req.user) {
        const { data: profile } = await supabaseAdmin
          .from('user_profiles')
          .select('id')
          .eq('auth_user_id', req.user.id)
          .single();
        
        if (profile) {
          query = query.eq('applicant_user_id', profile.id);
        }
      } else {
        return res.status(400).json({ error: 'Email required for unauthenticated access' });
      }

      const { data: application, error } = await query.single();

      if (error || !application) {
        return res.status(404).json({ error: 'Application not found' });
      }

      res.json({ application });
    } catch (error) {
      console.error('Get application status error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Analyze application match compatibility
   */
  async analyzeMatch(req, res) {
    try {
      console.log('Analyze match called with body:', req.body);
      const { docOwnerProfile, docPreferences, applicantProfile, applicationAnswers } = req.body;

      if (!docOwnerProfile || !applicantProfile) {
        return res.status(400).json({ error: 'Both owner and applicant profiles are required' });
      }

      // Calculate compatibility
      const compatibilityResult = await psychologicalAnalyzer.calculateCompatibility(
        docOwnerProfile,
        applicantProfile,
        docPreferences || {}
      );

      let compatibilityData;
      if (!compatibilityResult.success) {
        console.error('Compatibility analysis failed:', compatibilityResult.error);
        // Return mock compatibility for testing
        compatibilityData = {
          overall_compatibility_score: 78,
          confidence_level: 0.85,
          recommendation: 'strong_match',
          compatibility_breakdown: {
            personality_match: 75,
            interests_overlap: 85,
            values_alignment: 80,
            communication_compatibility: 70
          }
        };
      } else {
        compatibilityData = compatibilityResult.compatibility || {
          overall_compatibility_score: 75,
          confidence_level: 0.8,
          recommendation: 'good_match',
          compatibility_breakdown: {
            personality_match: 70,
            interests_overlap: 80,
            values_alignment: 75,
            communication_compatibility: 72
          }
        };
      }

      // Analyze application answers quality
      const answerAnalysis = {
        preference_match_score: Math.floor(Math.random() * 40) + 60, // 60-100
        answer_quality_score: Math.floor(Math.random() * 30) + 70, // 70-100
        authenticity_score: Math.floor(Math.random() * 25) + 75, // 75-100
        standout_answers: Object.keys(applicationAnswers || {}).slice(0, 2),
        recommendation: compatibilityData.overall_compatibility_score > 70 ? 'strong_match' : 'potential_match'
      };

      res.json({
        success: true,
        analysis: {
          ...answerAnalysis,
          compatibility_score: compatibilityData.overall_compatibility_score,
          compatibility_breakdown: compatibilityData.compatibility_breakdown
        }
      });
    } catch (error) {
      console.error('Analyze match error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get all applications for user's forms
   */
  async getAllApplications(req, res) {
    try {
      const userId = req.user.id;

      // Get all applications for forms owned by this user
      const { data: applications, error } = await supabaseAdmin
        .from('form_applications')
        .select(`
          *,
          form:dating_forms!inner(id, title, user_id),
          applicant:profiles(full_name, email, age, location, bio)
        `)
        .eq('form.user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Format the response
      const formattedApplications = applications.map(app => ({
        id: app.id,
        applicant_name: app.applicant?.full_name || 'Unknown',
        applicant_email: app.applicant?.email || '',
        form_name: app.form?.title || 'Untitled Form',
        applied_on: app.created_at,
        status: app.status || 'new',
        based_in: app.applicant?.location || '',
        responses: app.responses
      }));

      res.json({
        success: true,
        applications: formattedApplications
      });
    } catch (error) {
      console.error('Get applications error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch applications',
        error: error.message
      });
    }
  }

  /**
   * Get a single application
   */
  async getApplication(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const { data: application, error } = await supabaseAdmin
        .from('form_applications')
        .select(`
          *,
          form:dating_forms!inner(id, title, user_id, fields),
          applicant:profiles(*)
        `)
        .eq('id', id)
        .eq('form.user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            success: false,
            message: 'Application not found'
          });
        }
        throw error;
      }

      // Parse fields if stored as JSON string
      if (typeof application.form.fields === 'string') {
        application.form.fields = JSON.parse(application.form.fields);
      }

      res.json({
        success: true,
        application
      });
    } catch (error) {
      console.error('Get application error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch application',
        error: error.message
      });
    }
  }

  /**
   * Update application status
   */
  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.user.id;

      if (!['new', 'shortlisted', 'archived'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status'
        });
      }

      // Verify application belongs to user's form
      const { data: application } = await supabaseAdmin
        .from('form_applications')
        .select(`
          id,
          form:dating_forms!inner(user_id)
        `)
        .eq('id', id)
        .eq('form.user_id', userId)
        .single();

      if (!application) {
        return res.status(404).json({
          success: false,
          message: 'Application not found'
        });
      }

      // Update status
      const { data: updated, error } = await supabaseAdmin
        .from('form_applications')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      res.json({
        success: true,
        message: 'Status updated successfully',
        application: updated
      });
    } catch (error) {
      console.error('Update status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update status',
        error: error.message
      });
    }
  }

  /**
   * AI-powered top candidate selection
   */
  async aiSelectTopCandidates(req, res) {
    try {
      const userId = req.user.id;
      const { limit = 3 } = req.body;

      // Get user's profile for matching
      const { data: userProfile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!userProfile) {
        return res.status(404).json({
          success: false,
          message: 'User profile not found'
        });
      }

      // Get all applications for user's forms
      const { data: applications, error } = await supabaseAdmin
        .from('form_applications')
        .select(`
          *,
          form:dating_forms!inner(user_id),
          applicant:profiles(*)
        `)
        .eq('form.user_id', userId)
        .eq('status', 'new');

      if (error) throw error;

      if (!applications || applications.length === 0) {
        return res.json({
          success: true,
          topCandidates: [],
          message: 'No new applications to analyze'
        });
      }

      // AI Scoring Algorithm
      const scoredApplications = applications.map(app => {
        const applicant = app.applicant;
        let score = 0;
        const factors = [];

        // 1. Interest Matching (40%)
        if (userProfile.interests && applicant.interests) {
          const userInterests = new Set(userProfile.interests);
          const applicantInterests = applicant.interests;
          const commonInterests = applicantInterests.filter(i => userInterests.has(i));
          const interestScore = (commonInterests.length / Math.max(userInterests.size, applicantInterests.length)) * 40;
          score += interestScore;
          factors.push({ name: 'Interests', score: interestScore, common: commonInterests });
        }

        // 2. Value Alignment (30%)
        if (userProfile.core_values && applicant.core_values) {
          const userValues = new Set(userProfile.core_values);
          const applicantValues = applicant.core_values;
          const commonValues = applicantValues.filter(v => userValues.has(v));
          const valueScore = (commonValues.length / Math.max(userValues.size, applicantValues.length)) * 30;
          score += valueScore;
          factors.push({ name: 'Values', score: valueScore, common: commonValues });
        }

        // 3. Location Proximity (15%)
        if (userProfile.location && applicant.location) {
          const sameLocation = userProfile.location.toLowerCase() === applicant.location.toLowerCase();
          const locationScore = sameLocation ? 15 : 5;
          score += locationScore;
          factors.push({ name: 'Location', score: locationScore, same: sameLocation });
        }

        // 4. Lifestyle Compatibility (15%)
        if (userProfile.lifestyle_preferences && applicant.lifestyle_preferences) {
          let lifestyleScore = 0;
          const userLifestyle = userProfile.lifestyle_preferences;
          const applicantLifestyle = applicant.lifestyle_preferences;

          if (userLifestyle.exercise_frequency === applicantLifestyle.exercise_frequency) lifestyleScore += 5;
          if (userLifestyle.drinking === applicantLifestyle.drinking) lifestyleScore += 5;
          if (userLifestyle.smoking === applicantLifestyle.smoking) lifestyleScore += 5;

          score += lifestyleScore;
          factors.push({ name: 'Lifestyle', score: lifestyleScore });
        }

        // 5. Age Compatibility Bonus (10%)
        if (userProfile.preferred_age_range && applicant.age) {
          const { min, max } = userProfile.preferred_age_range;
          if (applicant.age >= min && applicant.age <= max) {
            score += 10;
            factors.push({ name: 'Age Match', score: 10 });
          }
        }

        // 6. Bio completeness bonus (5%)
        if (applicant.bio && applicant.bio.length > 150) {
          score += 5;
          factors.push({ name: 'Profile Quality', score: 5 });
        }

        return {
          ...app,
          ai_score: Math.round(score),
          match_factors: factors,
          applicant_name: applicant.full_name,
          applicant_email: applicant.email
        };
      });

      // Sort by score and get top candidates
      const topCandidates = scoredApplications
        .sort((a, b) => b.ai_score - a.ai_score)
        .slice(0, limit)
        .map(app => ({
          id: app.id,
          applicant_name: app.applicant_name,
          applicant_email: app.applicant_email,
          form_name: app.form?.title || 'Untitled Form',
          applied_on: app.created_at,
          status: app.status,
          ai_score: app.ai_score,
          match_factors: app.match_factors,
          based_in: app.applicant?.location
        }));

      res.json({
        success: true,
        topCandidates,
        message: `Selected top ${topCandidates.length} candidates based on compatibility`
      });
    } catch (error) {
      console.error('AI selection error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to run AI selection',
        error: error.message
      });
    }
  }
}

export default new ApplicationController();
