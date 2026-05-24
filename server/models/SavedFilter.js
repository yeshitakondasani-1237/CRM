import mongoose from 'mongoose';

const savedFilterSchema = new mongoose.Schema(
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
      index: true,
    },
    isPublic: {
      type: Boolean,
      default: false, // Private by default, can be shared with team
    },
    filters: {
      status: [String], // Array of status values
      assignedTo: [mongoose.Schema.Types.ObjectId],
      priority: [String],
      source: [String],
      minRevenue: Number,
      maxRevenue: Number,
      healthScore: {
        min: Number,
        max: Number,
      },
      dateRange: {
        startDate: Date,
        endDate: Date,
      },
      searchText: String,
      tags: [String],
    },
    sorting: {
      field: {
        type: String,
        default: 'createdAt',
      },
      order: {
        type: String,
        enum: ['asc', 'desc'],
        default: 'desc',
      },
    },
    isFavorite: {
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

const SavedFilter = mongoose.model('SavedFilter', savedFilterSchema);

export default SavedFilter;
