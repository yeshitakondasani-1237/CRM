import express from 'express';
import { getActivitiesByLead, createActivity } from '../controllers/activityController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .post(protect, createActivity);

router.route('/lead/:leadId')
  .get(protect, getActivitiesByLead);

export default router;
