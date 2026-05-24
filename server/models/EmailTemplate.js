import mongoose from 'mongoose';

const emailTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },
    subject: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['follow_up', 'proposal', 'contract', 'negotiation', 'closing', 'general'],
      default: 'general',
    },
    variables: [
      {
        name: String, // e.g., 'leadName', 'companyName', 'dealAmount'
        placeholder: String, // e.g., '{{leadName}}'
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const EmailTemplate = mongoose.model('EmailTemplate', emailTemplateSchema);

export default EmailTemplate;
