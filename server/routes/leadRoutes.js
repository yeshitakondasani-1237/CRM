import express from 'express';
import { 
  getLeads, getLeadById, createLead, updateLead, deleteLead, 
  archiveLead, exportLeads, importLeads 
} from '../controllers/leadController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';

const router = express.Router();

router.route('/')
  .get(protect, getLeads)
  .post(protect, createLead);

router.get('/export', protect, authorize('admin', 'manager'), exportLeads);
router.post('/import', protect, authorize('admin', 'manager'), importLeads);

router.route('/:id')
  .get(protect, getLeadById)
  .put(protect, updateLead)
  .delete(protect, authorize('admin', 'manager'), deleteLead);

router.put('/:id/archive', protect, archiveLead);

export default router;
