import supabaseAdmin from '../db/supabase.js';
import { v4 as uuidv4 } from 'uuid';

class DateMeDocController {
  /**
   * Create a new date-me-doc
   */
  async create(req, res) {
    try {
      // For testing without auth, create a default user
      let userId = req.user?.id || 'test-user-' + Date.now();
      
      const {
        title,
        description,
        header_content,
        slug,
        preferences,
        form_questions,
        is_public,
        settings,
        about_me,
        interests,
        deal_breakers,
        custom_questions,
        social_links
      } = req.body;

      // Check if slug is already taken
      const { data: existing } = await supabaseAdmin
        .from('date_me_docs')
        .select('id')
        .eq('slug', slug || title.toLowerCase().replace(/\s+/g, '-'))
        .single();

      if (existing) {
        return res.status(400).json({ error: 'Slug already taken. Please choose another.' });
      }

      // Get or create user profile
      let { data: userProfile, error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .select('id')
        .eq('auth_user_id', userId)
        .maybeSingle();

      if (!userProfile) {
        const { data: newProfile, error: insertError } = await supabaseAdmin
          .from('user_profiles')
          .insert({
            auth_user_id: userId,
            email: req.user?.email || 'test@example.com',
            name: req.user?.name || 'Test User'
          })
          .select()
          .single();
        
        if (insertError) {
          console.error('Error creating user profile:', insertError);
          return res.status(500).json({ error: 'Failed to create user profile: ' + insertError.message });
        }
        
        userProfile = newProfile;
      }

      // Prepare form questions
      const questions = custom_questions || form_questions || [];

      // Create date-me-doc
      const { data: doc, error } = await supabaseAdmin
        .from('date_me_docs')
        .insert({
          user_id: userProfile.id,
          title,
          description: description || about_me || '',
          header_content: header_content || {},
          slug: slug || title.toLowerCase().replace(/\s+/g, '-'),
          preferences: preferences || {},
          form_questions: questions,
          is_public: is_public !== false,
          settings: settings || {},
          about_me: about_me || description || '',
          interests: interests || [],
          deal_breakers: deal_breakers || [],
          custom_questions: questions,
          social_links: social_links || {}
        })
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({
        message: 'Date-me-doc created successfully',
        doc
      });
    } catch (error) {
      console.error('Create date-me-doc error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get date-me-doc by slug (public access)
   */
  async getBySlug(req, res) {
    try {
      const { slug } = req.params;

      const { data: doc, error } = await supabaseAdmin
        .from('date_me_docs')
        .select(`
          *,
          user_profiles (
            name,
            bio,
            avatar_url
          )
        `)
        .eq('slug', slug)
        .single();

      if (error || !doc) {
        return res.status(404).json({ error: 'Date-me-doc not found' });
      }

      if (!doc.is_active) {
        return res.status(403).json({ error: 'This date-me-doc is no longer active' });
      }

      // Increment view count
      await supabaseAdmin
        .from('date_me_docs')
        .update({ view_count: doc.view_count + 1 })
        .eq('id', doc.id);

      // Don't send user_id to public
      const { user_id, ...docData } = doc;

      res.json({ doc: docData });
    } catch (error) {
      console.error('Get date-me-doc error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get all date-me-docs for authenticated user
   */
  async getMyDocs(req, res) {
    try {
      const userId = req.user.id;

      const { data: userProfile } = await supabaseAdmin
        .from('user_profiles')
        .select('id')
        .eq('auth_user_id', userId)
        .single();

      if (!userProfile) {
        return res.json({ docs: [] });
      }

      const { data: docs, error } = await supabaseAdmin
        .from('date_me_docs')
        .select('*')
        .eq('user_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      res.json({ docs });
    } catch (error) {
      console.error('Get my docs error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Update date-me-doc
   */
  async update(req, res) {
    try {
      // For testing without auth, allow updates
      const userId = req.user?.id || 'test-user-' + Date.now();
      const { id } = req.params;
      const updates = req.body;

      // For testing, skip ownership check if no auth
      if (req.user) {
        // Check ownership
        const { data: doc } = await supabaseAdmin
          .from('date_me_docs')
          .select('user_id, user_profiles!inner(auth_user_id)')
          .eq('id', id)
          .single();

        if (!doc || doc.user_profiles.auth_user_id !== userId) {
          return res.status(403).json({ error: 'Not authorized to update this date-me-doc' });
        }
      }

      // Update
      const { data: updated, error } = await supabaseAdmin
        .from('date_me_docs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      res.json({
        message: 'Date-me-doc updated successfully',
        doc: updated
      });
    } catch (error) {
      console.error('Update date-me-doc error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Delete date-me-doc
   */
  async delete(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      // Check ownership
      const { data: doc } = await supabaseAdmin
        .from('date_me_docs')
        .select('user_id, user_profiles!inner(auth_user_id)')
        .eq('id', id)
        .single();

      if (!doc || doc.user_profiles.auth_user_id !== userId) {
        return res.status(403).json({ error: 'Not authorized to delete this date-me-doc' });
      }

      const { error } = await supabaseAdmin
        .from('date_me_docs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      res.json({ message: 'Date-me-doc deleted successfully' });
    } catch (error) {
      console.error('Delete date-me-doc error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get applications for a date-me-doc (owner only)
   */
  async getApplications(req, res) {
    try {
      // For testing without auth, allow access
      const userId = req.user?.id || 'test-user-' + Date.now();
      const { id } = req.params;
      const { status, limit = 50, offset = 0 } = req.query;

      // For testing, skip ownership check if no auth
      if (req.user) {
        // Check ownership
        const { data: doc } = await supabaseAdmin
          .from('date_me_docs')
          .select('user_id, user_profiles!inner(auth_user_id)')
          .eq('id', id)
          .single();

        if (!doc || doc.user_profiles.auth_user_id !== userId) {
          return res.status(403).json({ error: 'Not authorized to view applications' });
        }
      }

      let query = supabaseAdmin
        .from('applications')
        .select(`
          *,
          matchmaking_scores (
            overall_score,
            compatibility_breakdown,
            recommendation
          )
        `)
        .eq('date_me_doc_id', id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) {
        query = query.eq('status', status);
      }

      const { data: applications, error } = await query;

      if (error) throw error;

      res.json({ applications, total: applications.length });
    } catch (error) {
      console.error('Get applications error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Update application status
   */
  async updateApplicationStatus(req, res) {
    try {
      const userId = req.user.id;
      const { id, applicationId } = req.params;
      const { status } = req.body;

      if (!['pending', 'reviewed', 'shortlisted', 'rejected', 'matched'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      // Check ownership
      const { data: doc } = await supabaseAdmin
        .from('date_me_docs')
        .select('user_id, user_profiles!inner(auth_user_id)')
        .eq('id', id)
        .single();

      if (!doc || doc.user_profiles.auth_user_id !== userId) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      const { data: updated, error } = await supabaseAdmin
        .from('applications')
        .update({ status })
        .eq('id', applicationId)
        .eq('date_me_doc_id', id)
        .select()
        .single();

      if (error) throw error;

      res.json({
        message: 'Application status updated',
        application: updated
      });
    } catch (error) {
      console.error('Update application status error:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

export default new DateMeDocController();
