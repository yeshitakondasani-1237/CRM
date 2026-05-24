import express from 'express';
import { getTeamPerformance, getLeaderboard, getUserContributionHeatmap } from '../controllers/teamController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';

const router = express.Router();

router.get('/performance', protect, authorize('admin', 'manager'), getTeamPerformance);
router.get('/leaderboard', protect, getLeaderboard);
router.get('/heatmap/:userId', protect, getUserContributionHeatmap);

export default router;
