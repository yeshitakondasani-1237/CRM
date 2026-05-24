import mongoose from 'mongoose';

const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    required: true,
  },
  changedAt: {
    type: Date,
    default: Date.now,
  },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
});

const leadSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    contactPerson: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      default: '',
    },
    industry: {
      type: String,
      default: '',
    },
    location: {
      type: String,
      default: '',
    },
    source: {
      type: String,
      enum: ['Website', 'Referral', 'Cold Call', 'LinkedIn', 'Trade Show', 'Email Campaign', 'Other'],
      default: 'Other',
    },
    status: {
      type: String,
      enum: ['lead', 'contacted', 'qualified', 'proposal_sent', 'negotiation', 'won', 'lost'],
      default: 'lead',
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    expectedRevenue: {
      type: Number,
      default: 0,
    },
    closedRevenue: {
      type: Number,
      default: 0,
    },
    probability: {
      type: Number,
      min: 0,
      max: 100,
      default: 10, // Probability updates dynamically based on stage
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    notes: {
      type: String,
      default: '',
    },
    healthScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 50,
      index: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    stageEnteredAt: {
      type: Date,
      default: Date.now,
    },
    statusHistory: [statusHistorySchema],
  },
  {
    timestamps: true,
  }
);

// Indexes for common dashboard filters & performance
leadSchema.index({ status: 1, assignedTo: 1 });
leadSchema.index({ createdAt: -1 });

const Lead = mongoose.model('Lead', leadSchema);
export default Lead;
