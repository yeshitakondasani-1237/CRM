import express from 'express';
import {
  createAutomation,
  getAutomations,
  getAutomation,
  updateAutomation,
  executeAutomation,
  getAutomationLogs,
  deleteAutomation,
} from '../controllers/automationController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';

const router = express.Router();

// Automation CRUD (Admin/Manager only)
router.post('/', protect, authorize('admin', 'manager'), createAutomation);
router.get('/', protect, authorize('admin', 'manager'), getAutomations);
router.get('/:id', protect, authorize('admin', 'manager'), getAutomation);
router.put('/:id', protect, authorize('admin', 'manager'), updateAutomation);
router.delete('/:id', protect, authorize('admin', 'manager'), deleteAutomation);

// Automation execution
router.post('/:id/execute/:leadId', protect, executeAutomation);
router.get('/:id/logs', protect, authorize('admin', 'manager'), getAutomationLogs);

export default router;
