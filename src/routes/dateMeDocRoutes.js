import express from 'express';
import dateMeDocController from '../controllers/dateMeDocController.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { validateRequest, schemas } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Public routes
router.get('/:slug', asyncHandler(dateMeDocController.getBySlug));

// Protected routes (authentication optional for testing)
router.post(
  '/',
  validateRequest(schemas.createDateMeDoc),
  asyncHandler(dateMeDocController.create)
);

router.get(
  '/',
  asyncHandler(dateMeDocController.getMyDocs)
);

router.patch(
  '/:id',
  validateRequest(schemas.updateDateMeDoc),
  asyncHandler(dateMeDocController.update)
);

router.delete(
  '/:id',
  asyncHandler(dateMeDocController.delete)
);

// Application management routes (for doc owners)
router.get(
  '/:id/applications',
  asyncHandler(dateMeDocController.getApplications)
);

router.patch(
  '/:id/applications/:applicationId/status',
  asyncHandler(dateMeDocController.updateApplicationStatus)
);

export default router;
