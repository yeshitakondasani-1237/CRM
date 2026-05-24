import express from 'express';
import { generateReport, getReportsList } from '../controllers/reportController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';

const router = express.Router();

router.route('/')
  .post(protect, authorize('admin', 'manager'), generateReport)
  .get(protect, authorize('admin', 'manager'), getReportsList);

export default router;
