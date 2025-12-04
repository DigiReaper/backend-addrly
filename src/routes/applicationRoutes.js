import express from 'express';
import applicationController from '../controllers/applicationController.js';
import { optionalAuth } from '../middleware/auth.js';
import { validateRequest, schemas } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';

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

export default router;
