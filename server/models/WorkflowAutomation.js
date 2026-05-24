import mongoose from 'mongoose';

const workflowAutomationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    triggerType: {
      type: String,
      enum: ['status_change', 'revenue_milestone', 'time_based', 'manual', 'probability_change'],
      required: true,
    },
    triggerConditions: {
      // Flexible object to store trigger-specific conditions
      statusFrom: String,
      statusTo: String,
      revenueThreshold: Number,
      probabilityThreshold: Number,
      daysInStage: Number,
    },
    actions: [
      {
        actionType: {
          type: String,
          enum: ['assign_user', 'update_field', 'create_task', 'send_email', 'update_probability'],
        },
        actionData: mongoose.Schema.Types.Mixed, // Flexible data for different action types
      },
    ],
    executionLog: [
      {
        leadId: mongoose.Schema.Types.ObjectId,
        executedAt: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ['success', 'failed', 'skipped'],
        },
        details: String,
      },
    ],
    executionCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const WorkflowAutomation = mongoose.model('WorkflowAutomation', workflowAutomationSchema);

export default WorkflowAutomation;
