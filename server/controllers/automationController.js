import WorkflowAutomation from '../models/WorkflowAutomation.js';
import Lead from '../models/Lead.js';
import Task from '../models/Task.js';
import Activity from '../models/Activity.js';

// @desc    Create workflow automation rule
// @route   POST /api/automations
// @access  Private/Admin
export const createAutomation = async (req, res, next) => {
  try {
    const { name, description, triggerType, triggerConditions, actions, isActive } = req.body;

    const automation = new WorkflowAutomation({
      name,
      description,
      triggerType,
      triggerConditions,
      actions,
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user._id,
    });

    const created = await automation.save();
    await created.populate('createdBy', 'name email');

    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all automation rules
// @route   GET /api/automations
// @access  Private/Admin
export const getAutomations = async (req, res, next) => {
  try {
    const { active } = req.query;

    const query = {};
    if (active === 'true') {
      query.isActive = true;
    }

    const automations = await WorkflowAutomation.find(query)
      .populate('createdBy', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json(automations);
  } catch (error) {
    next(error);
  }
};

// @desc    Get specific automation rule
// @route   GET /api/automations/:id
// @access  Private/Admin
export const getAutomation = async (req, res, next) => {
  try {
    const automation = await WorkflowAutomation.findById(req.params.id).populate(
      'createdBy',
      'name email'
    );

    if (!automation) {
      res.status(404);
      throw new Error('Automation not found');
    }

    res.json(automation);
  } catch (error) {
    next(error);
  }
};

// @desc    Update automation rule
// @route   PUT /api/automations/:id
// @access  Private/Admin
export const updateAutomation = async (req, res, next) => {
  try {
    const { name, description, triggerConditions, actions, isActive } = req.body;
    const automation = await WorkflowAutomation.findById(req.params.id);

    if (!automation) {
      res.status(404);
      throw new Error('Automation not found');
    }

    automation.name = name || automation.name;
    automation.description = description || automation.description;
    automation.triggerConditions = triggerConditions || automation.triggerConditions;
    automation.actions = actions || automation.actions;
    automation.isActive = isActive !== undefined ? isActive : automation.isActive;

    const updated = await automation.save();
    await updated.populate('createdBy', 'name email');

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// @desc    Execute automation for a lead
// @route   POST /api/automations/:id/execute/:leadId
// @access  Private
export const executeAutomation = async (req, res, next) => {
  try {
    const { id: automationId, leadId } = req.params;

    const automation = await WorkflowAutomation.findById(automationId);
    const lead = await Lead.findById(leadId);

    if (!automation) {
      res.status(404);
      throw new Error('Automation not found');
    }

    if (!lead) {
      res.status(404);
      throw new Error('Lead not found');
    }

    if (!automation.isActive) {
      res.status(400);
      throw new Error('Automation is not active');
    }

    let executionResult = {
      leadId,
      executedAt: new Date(),
      status: 'success',
      details: 'Automation executed successfully',
      changes: [],
    };

    try {
      // Execute each action
      for (const action of automation.actions) {
        switch (action.actionType) {
          case 'assign_user':
            lead.assignedTo = action.actionData.userId;
            executionResult.changes.push(`Assigned to ${action.actionData.userId}`);
            break;

          case 'update_field':
            lead[action.actionData.field] = action.actionData.value;
            executionResult.changes.push(
              `Updated ${action.actionData.field} to ${action.actionData.value}`
            );
            break;

          case 'update_probability':
            lead.probability = action.actionData.probability;
            executionResult.changes.push(`Updated probability to ${action.actionData.probability}%`);
            break;

          case 'create_task':
            await Task.create({
              lead: leadId,
              assignedTo: action.actionData.assignTo || req.user._id,
              title: action.actionData.title,
              description: action.actionData.description,
              priority: action.actionData.priority || 'medium',
              dueDate: action.actionData.dueDate,
            });
            executionResult.changes.push(`Created task: ${action.actionData.title}`);
            break;

          case 'send_email':
            // Placeholder for email service integration
            executionResult.changes.push(`Email action queued: ${action.actionData.emailType}`);
            break;

          default:
            break;
        }
      }

      // Save lead changes
      await lead.save();

      // Create activity log
      await Activity.create({
        lead: leadId,
        user: req.user._id,
        type: 'automation_executed',
        title: 'Automation Executed',
        description: `${automation.name} automation executed. Changes: ${executionResult.changes.join(', ')}`,
      });

      // Log to automation
      automation.executionLog.push({
        leadId,
        executedAt: new Date(),
        status: 'success',
        details: executionResult.changes.join(', '),
      });
      automation.executionCount += 1;
      await automation.save();

      res.json(executionResult);
    } catch (error) {
      executionResult.status = 'failed';
      executionResult.details = error.message;

      automation.executionLog.push({
        leadId,
        executedAt: new Date(),
        status: 'failed',
        details: error.message,
      });
      await automation.save();

      throw error;
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get automation execution logs
// @route   GET /api/automations/:id/logs
// @access  Private/Admin
export const getAutomationLogs = async (req, res, next) => {
  try {
    const automation = await WorkflowAutomation.findById(req.params.id);

    if (!automation) {
      res.status(404);
      throw new Error('Automation not found');
    }

    const logs = automation.executionLog.slice(-100); // Last 100 executions
    res.json({
      automationId: automation._id,
      automationName: automation.name,
      totalExecutions: automation.executionCount,
      logs,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete automation rule
// @route   DELETE /api/automations/:id
// @access  Private/Admin
export const deleteAutomation = async (req, res, next) => {
  try {
    const automation = await WorkflowAutomation.findById(req.params.id);

    if (!automation) {
      res.status(404);
      throw new Error('Automation not found');
    }

    await WorkflowAutomation.findByIdAndDelete(req.params.id);
    res.json({ message: 'Automation deleted successfully' });
  } catch (error) {
    next(error);
  }
};
