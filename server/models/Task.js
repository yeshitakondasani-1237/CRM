import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['follow_up', 'meeting', 'call', 'email', 'other'],
      default: 'follow_up',
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    dueDate: {
      type: Date,
      required: true,
      index: true,
    },
    completedAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'overdue', 'cancelled'],
      default: 'pending',
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    reminder: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for quick dashboard queries on due/pending tasks
taskSchema.index({ assignedTo: 1, status: 1, dueDate: 1 });

const Task = mongoose.model('Task', taskSchema);
export default Task;
