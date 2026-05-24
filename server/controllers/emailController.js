import EmailTemplate from '../models/EmailTemplate.js';
import Activity from '../models/Activity.js';
import Lead from '../models/Lead.js';

// @desc    Create email template
// @route   POST /api/emails/templates
// @access  Private
export const createEmailTemplate = async (req, res, next) => {
  try {
    const { name, subject, body, category, variables } = req.body;

    const template = new EmailTemplate({
      name,
      subject,
      body,
      category: category || 'general',
      variables: variables || [],
      createdBy: req.user._id,
    });

    const created = await template.save();
    await created.populate('createdBy', 'name email');

    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all email templates
// @route   GET /api/emails/templates
// @access  Private
export const getEmailTemplates = async (req, res, next) => {
  try {
    const { category } = req.query;

    const query = {
      $or: [{ createdBy: req.user._id }, { isDefault: true }],
    };

    if (category) {
      query.category = category;
    }

    const templates = await EmailTemplate.find(query)
      .populate('createdBy', 'name email')
      .sort({ isDefault: -1, usageCount: -1 });

    res.json(templates);
  } catch (error) {
    next(error);
  }
};

// @desc    Get specific template
// @route   GET /api/emails/templates/:id
// @access  Private
export const getEmailTemplate = async (req, res, next) => {
  try {
    const template = await EmailTemplate.findById(req.params.id).populate(
      'createdBy',
      'name email'
    );

    if (!template) {
      res.status(404);
      throw new Error('Template not found');
    }

    res.json(template);
  } catch (error) {
    next(error);
  }
};

// @desc    Update email template
// @route   PUT /api/emails/templates/:id
// @access  Private
export const updateEmailTemplate = async (req, res, next) => {
  try {
    const { name, subject, body, category, variables } = req.body;
    const template = await EmailTemplate.findById(req.params.id);

    if (!template) {
      res.status(404);
      throw new Error('Template not found');
    }

    // Check ownership
    if (template.createdBy.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Only template owner can update');
    }

    template.name = name || template.name;
    template.subject = subject || template.subject;
    template.body = body || template.body;
    template.category = category || template.category;
    template.variables = variables || template.variables;

    const updated = await template.save();
    await updated.populate('createdBy', 'name email');

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// @desc    Log email sent to lead
// @route   POST /api/emails/log/:leadId
// @access  Private
export const logEmailSent = async (req, res, next) => {
  try {
    const { leadId } = req.params;
    const { templateId, subject, body, recipientEmail } = req.body;

    const lead = await Lead.findById(leadId);
    if (!lead) {
      res.status(404);
      throw new Error('Lead not found');
    }

    // Update template usage if using a template
    if (templateId) {
      const template = await EmailTemplate.findById(templateId);
      if (template) {
        template.usageCount += 1;
        await template.save();
      }
    }

    // Create activity log
    const activity = await Activity.create({
      lead: leadId,
      user: req.user._id,
      type: 'email_sent',
      title: 'Email Sent',
      description: `Email sent to ${recipientEmail}: "${subject}"`,
    });

    res.json({
      message: 'Email logged successfully',
      activity,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get email history for a lead
// @route   GET /api/emails/history/:leadId
// @access  Private
export const getEmailHistory = async (req, res, next) => {
  try {
    const { leadId } = req.params;

    const lead = await Lead.findById(leadId);
    if (!lead) {
      res.status(404);
      throw new Error('Lead not found');
    }

    const emailActivities = await Activity.find({
      lead: leadId,
      type: 'email_sent',
    })
      .populate('user', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json(emailActivities);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete email template
// @route   DELETE /api/emails/templates/:id
// @access  Private
export const deleteEmailTemplate = async (req, res, next) => {
  try {
    const template = await EmailTemplate.findById(req.params.id);

    if (!template) {
      res.status(404);
      throw new Error('Template not found');
    }

    // Check ownership
    if (template.createdBy.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Only template owner can delete');
    }

    await EmailTemplate.findByIdAndDelete(req.params.id);
    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    next(error);
  }
};
