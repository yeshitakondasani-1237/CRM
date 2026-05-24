import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['lead', 'revenue', 'performance', 'monthly_sales'],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    filters: {
      type: mongoose.Schema.Types.Mixed, // Stored query filter parameters
      default: {},
    },
    data: {
      type: mongoose.Schema.Types.Mixed, // Cached report JSON data
      default: {},
    },
    format: {
      type: String,
      enum: ['pdf', 'excel'],
      required: true,
    },
    fileUrl: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const Report = mongoose.model('Report', reportSchema);
export default Report;
