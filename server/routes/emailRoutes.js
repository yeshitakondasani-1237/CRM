import express from 'express';
import {
  createEmailTemplate,
  getEmailTemplates,
  getEmailTemplate,
  updateEmailTemplate,
  logEmailSent,
  getEmailHistory,
  deleteEmailTemplate,
} from '../controllers/emailController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Email templates
router.post('/templates', protect, createEmailTemplate);
router.get('/templates', protect, getEmailTemplates);
router.get('/templates/:id', protect, getEmailTemplate);
router.put('/templates/:id', protect, updateEmailTemplate);
router.delete('/templates/:id', protect, deleteEmailTemplate);

// Email logging
router.post('/log/:leadId', protect, logEmailSent);
router.get('/history/:leadId', protect, getEmailHistory);

export default router;
