import mongoose from 'mongoose';

const importLogSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      required: true,
    },
    importedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    totalRecords: {
      type: Number,
      required: true,
    },
    successfulRecords: {
      type: Number,
      default: 0,
    },
    failedRecords: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'failed'],
      default: 'pending',
    },
    errors: [
      {
        rowNumber: Number,
        field: String,
        errorMessage: String,
        value: String,
      },
    ],
    createdLeadIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lead',
      },
    ],
    summary: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const ImportLog = mongoose.model('ImportLog', importLogSchema);

export default ImportLog;
