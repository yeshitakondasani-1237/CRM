import Task from '../models/Task.js';
import Lead from '../models/Lead.js';
import Notification from '../models/Notification.js';

// @desc    Get all tasks / follow-ups
// @route   GET /api/tasks
// @access  Private
export const getTasks = async (req, res, next) => {
  try {
    const { status, leadId, priority, limit = 100 } = req.query;

    const query = {};

    // Role-based scope
    if (req.user.role === 'executive') {
      query.assignedTo = req.user._id;
    }

    if (status) query.status = status;
    if (leadId) query.lead = leadId;
    if (priority) query.priority = priority;

    // Automatically check and mark overdue tasks dynamically
    const now = new Date();
    const overdueTasks = await Task.find({
      ...query,
      status: 'pending',
      dueDate: { $lt: now }
    });

    if (overdueTasks.length > 0) {
      for (const t of overdueTasks) {
        t.status = 'overdue';
        await t.save();

        // Create notification for overdue task
        await Notification.create({
          user: t.assignedTo,
          type: 'follow_up_missed',
          title: 'Overdue Follow-up Alert',
          message: `Your follow-up task '${t.title}' is overdue! Please complete it.`,
          link: `/leads/${t.lead || ''}`
        });
      }
    }

    const tasks = await Task.find(query)
      .populate('lead', 'companyName contactPerson email')
      .populate('assignedTo', 'name email avatar')
      .populate('assignedBy', 'name')
      .sort({ dueDate: 1 })
      .limit(Number(limit));

    res.json(tasks);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new task / follow-up
// @route   POST /api/tasks
// @access  Private
export const createTask = async (req, res, next) => {
  const { lead, assignedTo, type, title, description, dueDate, priority, reminder } = req.body;

  try {
    let assignee = assignedTo;
    if (!assignee && req.user.role === 'executive') {
      assignee = req.user._id;
    }

    const task = new Task({
      lead: lead || null,
      assignedTo: assignee,
      assignedBy: req.user._id,
      type: type || 'follow_up',
      title,
      description: description || '',
      dueDate: new Date(dueDate),
      priority: priority || 'medium',
      reminder: reminder ? new Date(reminder) : null,
    });

    const createdTask = await task.save();

    // Notify assignee if not the creator
    if (assignee.toString() !== req.user._id.toString()) {
      await Notification.create({
        user: assignee,
        type: 'lead_assigned',
        title: 'New Follow-up Task Assigned',
        message: `Task '${title}' has been assigned to you by ${req.user.name}.`,
        link: `/leads/${lead || ''}`,
      });
    }

    res.status(201).json(createdTask);
  } catch (error) {
    next(error);
  }
};

// @desc    Update task details / complete a task
// @route   PUT /api/tasks/:id
// @access  Private
export const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      res.status(404);
      throw new Error('Task not found');
    }

    // Executive ownership check
    if (req.user.role === 'executive' && task.assignedTo.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Access denied: You are not assigned to this task');
    }

    const oldStatus = task.status;
    const newStatus = req.body.status;

    task.title = req.body.title || task.title;
    task.description = req.body.description !== undefined ? req.body.description : task.description;
    task.dueDate = req.body.dueDate ? new Date(req.body.dueDate) : task.dueDate;
    task.priority = req.body.priority || task.priority;
    task.type = req.body.type || task.type;
    task.status = newStatus || task.status;
    task.reminder = req.body.reminder ? new Date(req.body.reminder) : task.reminder;

    // Handle completed timestamps
    if (newStatus === 'completed' && oldStatus !== 'completed') {
      task.completedAt = new Date();
    } else if (newStatus && newStatus !== 'completed') {
      task.completedAt = null;
    }

    const updatedTask = await task.save();
    res.json(updatedTask);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
export const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      res.status(404);
      throw new Error('Task not found');
    }

    // Role verification
    if (req.user.role === 'executive' && task.assignedTo.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Access denied: You are not assigned to this task');
    }

    await task.deleteOne();
    res.json({ message: 'Task removed successfully' });
  } catch (error) {
    next(error);
  }
};
