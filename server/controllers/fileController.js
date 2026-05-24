import Document from '../models/Document.js';
import Lead from '../models/Lead.js';
import Activity from '../models/Activity.js';

// @desc    Upload document for a lead
// @route   POST /api/files/upload/:leadId
// @access  Private
export const uploadDocument = async (req, res, next) => {
  try {
    const { leadId } = req.params;
    const { fileUrl, fileName, fileSize, fileType, documentType, description } = req.body;

    // Verify lead exists
    const lead = await Lead.findById(leadId);
    if (!lead) {
      res.status(404);
      throw new Error('Lead not found');
    }

    const document = new Document({
      fileName,
      fileUrl,
      fileSize,
      fileType,
      documentType: documentType || 'other',
      lead: leadId,
      uploadedBy: req.user._id,
      description: description || '',
    });

    const savedDocument = await document.save();

    // Create activity log
    await Activity.create({
      lead: leadId,
      user: req.user._id,
      type: 'document_upload',
      title: 'Document Uploaded',
      description: `${documentType || 'Document'} "${fileName}" uploaded by ${req.user.name}`,
    });

    res.status(201).json(savedDocument);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all documents for a lead
// @route   GET /api/files/:leadId
// @access  Private
export const getLeadDocuments = async (req, res, next) => {
  try {
    const { leadId } = req.params;
    const { type, archived = false } = req.query;

    const query = {
      lead: leadId,
      isArchived: archived === 'true',
    };

    if (type) {
      query.documentType = type;
    }

    const documents = await Document.find(query)
      .populate('uploadedBy', 'name email avatar')
      .populate('sharedWith.user', 'name email')
      .sort({ createdAt: -1 });

    res.json(documents);
  } catch (error) {
    next(error);
  }
};

// @desc    Get document details
// @route   GET /api/files/document/:docId
// @access  Private
export const getDocument = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.docId)
      .populate('uploadedBy', 'name email avatar')
      .populate('sharedWith.user', 'name email');

    if (!document) {
      res.status(404);
      throw new Error('Document not found');
    }

    res.json(document);
  } catch (error) {
    next(error);
  }
};

// @desc    Update document details
// @route   PUT /api/files/document/:docId
// @access  Private
export const updateDocument = async (req, res, next) => {
  try {
    const { description, documentType, version } = req.body;
    const document = await Document.findById(req.params.docId);

    if (!document) {
      res.status(404);
      throw new Error('Document not found');
    }

    // Check if user is owner
    if (document.uploadedBy.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Only document owner can update');
    }

    document.description = description || document.description;
    document.documentType = documentType || document.documentType;
    if (version) document.version = version;

    const updatedDocument = await document.save();
    res.json(updatedDocument);
  } catch (error) {
    next(error);
  }
};

// @desc    Share document with team members
// @route   POST /api/files/document/:docId/share
// @access  Private
export const shareDocument = async (req, res, next) => {
  try {
    const { userId, permission } = req.body; // permission: 'view', 'edit', 'download'
    const document = await Document.findById(req.params.docId);

    if (!document) {
      res.status(404);
      throw new Error('Document not found');
    }

    // Check if user is owner
    if (document.uploadedBy.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Only document owner can share');
    }

    // Check if already shared
    const alreadyShared = document.sharedWith.some(
      (share) => share.user.toString() === userId
    );

    if (!alreadyShared) {
      document.sharedWith.push({
        user: userId,
        permission: permission || 'view',
      });
    } else {
      // Update permission
      const share = document.sharedWith.find(
        (share) => share.user.toString() === userId
      );
      share.permission = permission;
    }

    const updatedDocument = await document.save();
    res.json(updatedDocument);
  } catch (error) {
    next(error);
  }
};

// @desc    Revoke document sharing
// @route   DELETE /api/files/document/:docId/share/:userId
// @access  Private
export const revokeDocumentShare = async (req, res, next) => {
  try {
    const { docId, userId } = req.params;
    const document = await Document.findById(docId);

    if (!document) {
      res.status(404);
      throw new Error('Document not found');
    }

    // Check if user is owner
    if (document.uploadedBy.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Only document owner can revoke sharing');
    }

    document.sharedWith = document.sharedWith.filter(
      (share) => share.user.toString() !== userId
    );

    const updatedDocument = await document.save();
    res.json(updatedDocument);
  } catch (error) {
    next(error);
  }
};

// @desc    Archive/delete document
// @route   DELETE /api/files/document/:docId
// @access  Private
export const deleteDocument = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.docId);

    if (!document) {
      res.status(404);
      throw new Error('Document not found');
    }

    // Check if user is owner
    if (document.uploadedBy.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Only document owner can delete');
    }

    document.isArchived = true;
    await document.save();

    res.json({ message: 'Document archived successfully' });
  } catch (error) {
    next(error);
  }
};
