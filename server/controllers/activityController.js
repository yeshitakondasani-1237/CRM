import Activity from '../models/Activity.js';
import Lead from '../models/Lead.js';

// @desc    Get all activities for a specific lead
// @route   GET /api/activities/lead/:leadId
// @access  Private
export const getActivitiesByLead = async (req, res, next) => {
  try {
    const activities = await Activity.find({ lead: req.params.leadId })
      .populate('user', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json(activities);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new activity (log interaction)
// @route   POST /api/activities
// @access  Private
export const createActivity = async (req, res, next) => {
  const { lead, type, title, description, outcome, duration, attachments } = req.body;

  try {
    const leadExists = await Lead.findById(lead);
    if (!leadExists) {
      res.status(404);
      throw new Error('Lead not found');
    }

    // Sales Executive verification
    if (req.user.role === 'executive' && leadExists.assignedTo?.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Access denied: You are not assigned to this lead');
    }

    const activity = new Activity({
      lead,
      user: req.user._id,
      type,
      title,
      description: description || '',
      outcome: outcome || '',
      duration: duration || 0,
      attachments: attachments || [],
    });

    const createdActivity = await activity.save();

    // Trigger Lead Health Score recalculation upon activity log
    // We will import this service or call it in the controller
    // Let's implement the lead update logic or simply proceed
    leadExists.updatedAt = new Date();
    await leadExists.save();

    res.status(201).json(createdActivity);
  } catch (error) {
    next(error);
  }
};
