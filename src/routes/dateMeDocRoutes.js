import express from 'express';
import dateMeDocController from '../controllers/dateMeDocController.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { validateRequest, schemas } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Public routes
router.get('/:slug', optionalAuth, asyncHandler(dateMeDocController.getBySlug));

// Protected routes (require authentication)
router.post(
  '/',
  requireAuth,
  validateRequest(schemas.createDateMeDoc),
  asyncHandler(dateMeDocController.create)
);

router.get(
  '/',
  requireAuth,
  asyncHandler(dateMeDocController.getMyDocs)
);

router.put(
  '/:id',
  requireAuth,
  validateRequest(schemas.updateDateMeDoc),
  asyncHandler(dateMeDocController.update)
);

router.delete(
  '/:id',
  requireAuth,
  asyncHandler(dateMeDocController.delete)
);

// Application management routes (for doc owners)
router.get(
  '/:id/applications',
  requireAuth,
  asyncHandler(dateMeDocController.getApplications)
);

router.patch(
  '/:id/applications/:applicationId/status',
  requireAuth,
  asyncHandler(dateMeDocController.updateApplicationStatus)
);

export default router;
