import express from 'express';
import {
  createSavedFilter,
  getSavedFilters,
  getSavedFilter,
  updateSavedFilter,
  applyFilter,
  deleteSavedFilter,
} from '../controllers/filterController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Filter CRUD
router.post('/', protect, createSavedFilter);
router.get('/', protect, getSavedFilters);
router.get('/:id', protect, getSavedFilter);
router.put('/:id', protect, updateSavedFilter);
router.post('/:id/apply', protect, applyFilter);
router.delete('/:id', protect, deleteSavedFilter);

export default router;
