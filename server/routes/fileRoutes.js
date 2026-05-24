import express from 'express';
import {
  uploadDocument,
  getLeadDocuments,
  getDocument,
  updateDocument,
  shareDocument,
  revokeDocumentShare,
  deleteDocument,
} from '../controllers/fileController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Document upload and retrieval
router.post('/upload/:leadId', protect, uploadDocument);
router.get('/:leadId', protect, getLeadDocuments);
router.get('/document/:docId', protect, getDocument);

// Document management
router.put('/document/:docId', protect, updateDocument);
router.post('/document/:docId/share', protect, shareDocument);
router.delete('/document/:docId/share/:userId', protect, revokeDocumentShare);
router.delete('/document/:docId', protect, deleteDocument);

export default router;
