import supabaseAdmin from '../db/supabase.js';
import contentExtractor from '../services/contentExtractor.js';
import psychologicalAnalyzer from '../services/psychologicalAnalyzer.js';
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
          submitted_links,
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
      this.processApplicationAsync(application.id, doc.id).catch(console.error);
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
            user_profiles (
              id,
              auth_user_id
            )
          `)
          .eq('id', docId)
          .single();

        // Get or create owner's psychological profile
        const { data: ownerAnalysis } = await supabaseAdmin
          .from('content_analysis')
          .select('psychological_profile')
          .eq('user_id', doc.user_profiles.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        let ownerProfile = ownerAnalysis?.psychological_profile;

        // If owner doesn't have profile, create basic one from preferences
        if (!ownerProfile) {
          ownerProfile = {
            preferences: doc.preferences,
            description: doc.description
          };
        }

        // Calculate compatibility
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

          // Store matchmaking score
          await supabaseAdmin
            .from('matchmaking_scores')
            .insert({
              application_id: applicationId,
              date_me_doc_id: docId,
              doc_owner_user_id: doc.user_profiles.id,
              applicant_user_id: application.applicant_user_id,
              overall_score: overallScore,
              compatibility_breakdown: compatibilityAnalysis.compatibility.compatibility_breakdown,
              matching_factors: compatibilityAnalysis.compatibility.matching_factors,
              red_flags: compatibilityAnalysis.compatibility.red_flags,
              green_flags: compatibilityAnalysis.compatibility.green_flags,
              recommendation: compatibilityAnalysis.compatibility.recommendation,
              confidence_level: compatibilityAnalysis.compatibility.confidence_level
            });

          // Update application
          await supabaseAdmin
            .from('applications')
            .update({
              compatibility_score: overallScore,
              analysis_completed: true
            })
            .eq('id', applicationId);
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
}

export default new ApplicationController();
