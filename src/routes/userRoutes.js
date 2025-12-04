import express from 'express';
import userController from '../controllers/userController.js';
import { requireAuth } from '../middleware/auth.js';
import { validateRequest, schemas } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// All user routes (auth optional for testing)
router.get(
  '/profile',
  asyncHandler(userController.getProfile)
);

router.put(
  '/profile',
  validateRequest(schemas.updateUserProfile),
  asyncHandler(userController.updateProfile)
);

router.post(
  '/extract-content',
  asyncHandler(userController.extractContent)
);

router.post(
  '/analyze-profile',
  asyncHandler(userController.analyzeProfile)
);

router.post(
  '/calculate-compatibility',
  asyncHandler(userController.calculateCompatibility)
);

router.post(
  '/analyze',
  asyncHandler(userController.analyzeFootprint)
);

router.get(
  '/analysis',
  asyncHandler(userController.getAnalysis)
);

export default router;
