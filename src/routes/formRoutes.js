// Form Management Routes
import express from 'express';
import formController from '../controllers/formController.js';
import { authenticateUser } from '../config/auth.js';

const router = express.Router();

// Public routes (no auth required)
router.get('/public/:id', formController.getPublicForm);
router.post('/public/:id/submit', formController.submitFormApplication);

// All other routes require authentication
router.use(authenticateUser);

// Form CRUD operations
router.post('/', formController.createForm);
router.get('/', formController.getUserForms);
router.get('/:id', formController.getForm);
router.put('/:id', formController.updateForm);
router.delete('/:id', formController.deleteForm);

// Form applications
router.get('/:id/applications', formController.getFormApplications);

export default router;
