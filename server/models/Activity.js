import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema(
  {
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['call', 'email', 'meeting', 'note', 'status_change', 'attachment'],
      required: true,
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
    outcome: {
      type: String,
      default: '', // e.g. 'Completed', 'No Answer', 'Busy', 'Scheduled'
    },
    duration: {
      type: Number, // in minutes, e.g. for calls/meetings
      default: 0,
    },
    attachments: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes
activitySchema.index({ lead: 1, createdAt: -1 });

const Activity = mongoose.model('Activity', activitySchema);
export default Activity;
