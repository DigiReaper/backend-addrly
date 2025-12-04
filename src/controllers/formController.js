// Form Controller
import supabaseAdmin from '../db/supabase.js';

class FormController {

  async createForm(req, res) {
    try {
      const userId = req.user.id;
      const { title, description, fields, status } = req.body;

      if (!title) {
        return res.status(400).json({
          success: false,
          message: 'Form title is required'
        });
      }

      // Insert form into database
      const { data: form, error } = await supabaseAdmin
        .from('dating_forms')
        .insert({
          user_id: userId,
          title,
          description,
          fields: JSON.stringify(fields || []),
          status: status || 'draft',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({
        success: true,
        message: 'Form created successfully',
        form
      });
    } catch (error) {
      console.error('Create form error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create form',
        error: error.message
      });
    }
  }

  // Get all forms for a user
  async getUserForms(req, res) {
    try {
      const userId = req.user.id;

      const { data: forms, error } = await supabaseAdmin
        .from('dating_forms')
        .select(`
          *,
          applications:form_applications(count)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Format the response
      const formsWithCount = forms.map(form => ({
        ...form,
        fields: JSON.parse(form.fields || '[]'),
        applications_count: form.applications[0]?.count || 0
      }));

      res.json({
        success: true,
        forms: formsWithCount
      });
    } catch (error) {
      console.error('Get forms error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch forms',
        error: error.message
      });
    }
  }

  // Get a single form
  async getForm(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const { data: form, error } = await supabaseAdmin
        .from('dating_forms')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            success: false,
            message: 'Form not found'
          });
        }
        throw error;
      }

      form.fields = JSON.parse(form.fields || '[]');

      res.json({
        success: true,
        form
      });
    } catch (error) {
      console.error('Get form error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch form',
        error: error.message
      });
    }
  }

  // Update a form
  async updateForm(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { title, description, fields, status } = req.body;

      const updates = {};
      if (title) updates.title = title;
      if (description !== undefined) updates.description = description;
      if (fields) updates.fields = JSON.stringify(fields);
      if (status) updates.status = status;
      updates.updated_at = new Date().toISOString();

      const { data: form, error } = await supabaseAdmin
        .from('dating_forms')
        .update(updates)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            success: false,
            message: 'Form not found'
          });
        }
        throw error;
      }

      form.fields = JSON.parse(form.fields || '[]');

      res.json({
        success: true,
        message: 'Form updated successfully',
        form
      });
    } catch (error) {
      console.error('Update form error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update form',
        error: error.message
      });
    }
  }

  // Delete a form
  async deleteForm(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const { error } = await supabaseAdmin
        .from('dating_forms')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;

      res.json({
        success: true,
        message: 'Form deleted successfully'
      });
    } catch (error) {
      console.error('Delete form error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete form',
        error: error.message
      });
    }
  }

  // Get applications for a form
  async getFormApplications(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Verify form belongs to user
      const { data: form } = await supabaseAdmin
        .from('dating_forms')
        .select('id')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (!form) {
        return res.status(404).json({
          success: false,
          message: 'Form not found'
        });
      }

      const { data: applications, error } = await supabaseAdmin
        .from('form_applications')
        .select(`
          *,
          applicant:profiles(full_name, email, age, location, bio, interests)
        `)
        .eq('form_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      res.json({
        success: true,
        applications
      });
    } catch (error) {
      console.error('Get form applications error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch applications',
        error: error.message
      });
    }
  }
}

export default new FormController();
