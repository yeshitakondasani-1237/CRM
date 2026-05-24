import express from 'express';
import { getRecommendations, getRevenueForecast, getLeadAging } from '../controllers/smartController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/recommendations', protect, getRecommendations);
router.get('/revenue-forecast', protect, getRevenueForecast);
router.get('/lead-aging', protect, getLeadAging);

export default router;
