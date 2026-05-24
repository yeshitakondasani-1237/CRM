import express from 'express';
import { getKPIs, getCharts, getWidgets } from '../controllers/dashboardController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/kpis', protect, getKPIs);
router.get('/charts', protect, getCharts);
router.get('/widgets', protect, getWidgets);

export default router;
