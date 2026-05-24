import express from 'express';
import { authUser, registerUser, publicRegister, getUserProfile, updateUserProfile } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';

const router = express.Router();

router.post('/login', authUser);
router.post('/signup', publicRegister);  // Public self-registration
router.post('/register', protect, authorize('admin'), registerUser);  // Admin-only employee registration
router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

export default router;
