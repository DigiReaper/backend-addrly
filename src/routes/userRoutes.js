import express from 'express';
import userController from '../controllers/userController.js';
import { requireAuth } from '../middleware/auth.js';
import { validateRequest, schemas } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// All user routes require authentication
router.get(
  '/profile',
  requireAuth,
  asyncHandler(userController.getProfile)
);

router.put(
  '/profile',
  requireAuth,
  validateRequest(schemas.updateUserProfile),
  asyncHandler(userController.updateProfile)
);

router.post(
  '/analyze',
  requireAuth,
  asyncHandler(userController.analyzeFootprint)
);

router.get(
  '/analysis',
  requireAuth,
  asyncHandler(userController.getAnalysis)
);

export default router;
