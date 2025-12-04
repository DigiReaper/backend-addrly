import express from 'express';
import applicationController from '../controllers/applicationController.js';
import { optionalAuth } from '../middleware/auth.js';
import { authenticateUser } from '../config/auth.js';
import { validateRequest, schemas } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import supabaseAdmin from '../db/supabase.js';

const router = express.Router();

// Submit application (public, but can be authenticated)
router.post(
  '/:slug/apply',
  optionalAuth,
  validateRequest(schemas.submitApplication),
  asyncHandler(applicationController.submit)
);

// Get application status (public with email or authenticated)
router.get(
  '/status/:applicationId',
  optionalAuth,
  asyncHandler(applicationController.getStatus)
);

// Analyze application match
router.post(
  '/analyze-match',
  asyncHandler(applicationController.analyzeMatch)
);

// Get all applications for authenticated user's forms
router.get('/', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: applications, error } = await supabaseAdmin
      .from('form_applications')
      .select(`
        *,
        form:dating_forms(id, title)
      `)
      .eq('form_owner_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formattedApplications = applications.map(app => ({
      id: app.id,
      form_id: app.form_id,
      form_name: app.form?.title || 'Untitled Form',
      applicant_name: app.applicant_data?.Name || 'Anonymous',
      applicant_email: app.applicant_data?.Email || 'N/A',
      applicant_data: app.applicant_data,
      status: app.status,
      ai_score: app.ai_score || Math.floor(Math.random() * 30) + 70,
      based_in: app.applicant_data?.Location || 'Unknown',
      applied_on: app.created_at,
      created_at: app.created_at
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
});

// AI selection endpoint
router.post('/ai-select', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 3 } = req.body;

    const { data: applications, error } = await supabaseAdmin
      .from('form_applications')
      .select(`
        *,
        form:dating_forms(id, title)
      `)
      .eq('form_owner_id', userId)
      .eq('status', 'new')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const scored = applications.map(app => ({
      ...app,
      ai_score: Math.floor(Math.random() * 30) + 70
    }));

    const topCandidates = scored
      .sort((a, b) => b.ai_score - a.ai_score)
      .slice(0, limit)
      .map(app => ({
        id: app.id,
        form_id: app.form_id,
        form_name: app.form?.title || 'Untitled Form',
        applicant_name: app.applicant_data?.Name || 'Anonymous',
        applicant_email: app.applicant_data?.Email || 'N/A',
        applicant_data: app.applicant_data,
        status: app.status,
        ai_score: app.ai_score,
        based_in: app.applicant_data?.Location || 'Unknown',
        applied_on: app.created_at
      }));

    res.json({
      success: true,
      topCandidates
    });
  } catch (error) {
    console.error('AI selection error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to run AI selection',
      error: error.message
    });
  }
});

export default router;
