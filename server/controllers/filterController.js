import SavedFilter from '../models/SavedFilter.js';
import Lead from '../models/Lead.js';

// @desc    Create a new saved filter
// @route   POST /api/filters
// @access  Private
export const createSavedFilter = async (req, res, next) => {
  try {
    const { name, description, filters, sorting, isPublic, isFavorite } = req.body;

    const savedFilter = new SavedFilter({
      name,
      description,
      filters,
      sorting: sorting || { field: 'createdAt', order: 'desc' },
      isPublic: isPublic || false,
      isFavorite: isFavorite || false,
      createdBy: req.user._id,
    });

    const created = await savedFilter.save();
    await created.populate('createdBy', 'name email avatar');

    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all saved filters for user
// @route   GET /api/filters
// @access  Private
export const getSavedFilters = async (req, res, next) => {
  try {
    const { favoriteOnly = false } = req.query;

    const query = {
      $or: [
        { createdBy: req.user._id },
        { isPublic: true }, // Include public filters
      ],
    };

    if (favoriteOnly === 'true') {
      query.isFavorite = true;
    }

    const filters = await SavedFilter.find(query)
      .populate('createdBy', 'name email avatar')
      .sort({ isFavorite: -1, createdAt: -1 });

    res.json(filters);
  } catch (error) {
    next(error);
  }
};

// @desc    Get specific saved filter
// @route   GET /api/filters/:id
// @access  Private
export const getSavedFilter = async (req, res, next) => {
  try {
    const filter = await SavedFilter.findById(req.params.id).populate(
      'createdBy',
      'name email avatar'
    );

    if (!filter) {
      res.status(404);
      throw new Error('Filter not found');
    }

    res.json(filter);
  } catch (error) {
    next(error);
  }
};

// @desc    Update saved filter
// @route   PUT /api/filters/:id
// @access  Private
export const updateSavedFilter = async (req, res, next) => {
  try {
    const { name, description, filters, sorting, isPublic, isFavorite } =
      req.body;
    const filter = await SavedFilter.findById(req.params.id);

    if (!filter) {
      res.status(404);
      throw new Error('Filter not found');
    }

    // Check ownership
    if (filter.createdBy.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Only filter owner can update');
    }

    filter.name = name || filter.name;
    filter.description = description || filter.description;
    filter.filters = filters || filter.filters;
    filter.sorting = sorting || filter.sorting;
    filter.isPublic = isPublic !== undefined ? isPublic : filter.isPublic;
    filter.isFavorite = isFavorite !== undefined ? isFavorite : filter.isFavorite;

    const updated = await filter.save();
    await updated.populate('createdBy', 'name email avatar');

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// @desc    Apply filter to get leads
// @route   POST /api/filters/:id/apply
// @access  Private
export const applyFilter = async (req, res, next) => {
  try {
    const filter = await SavedFilter.findById(req.params.id);

    if (!filter) {
      res.status(404);
      throw new Error('Filter not found');
    }

    // Update usage count
    filter.usageCount += 1;
    await filter.save();

    // Build query from filter conditions
    const query = { isArchived: false };

    if (filter.filters.status && filter.filters.status.length > 0) {
      query.status = { $in: filter.filters.status };
    }

    if (filter.filters.priority && filter.filters.priority.length > 0) {
      query.priority = { $in: filter.filters.priority };
    }

    if (filter.filters.source && filter.filters.source.length > 0) {
      query.source = { $in: filter.filters.source };
    }

    if (filter.filters.assignedTo && filter.filters.assignedTo.length > 0) {
      query.assignedTo = { $in: filter.filters.assignedTo };
    }

    if (filter.filters.tags && filter.filters.tags.length > 0) {
      query.tags = { $in: filter.filters.tags };
    }

    // Revenue range
    if (filter.filters.minRevenue || filter.filters.maxRevenue) {
      query.expectedRevenue = {};
      if (filter.filters.minRevenue) {
        query.expectedRevenue.$gte = filter.filters.minRevenue;
      }
      if (filter.filters.maxRevenue) {
        query.expectedRevenue.$lte = filter.filters.maxRevenue;
      }
    }

    // Health score range
    if (
      filter.filters.healthScore &&
      (filter.filters.healthScore.min || filter.filters.healthScore.max)
    ) {
      query.healthScore = {};
      if (filter.filters.healthScore.min) {
        query.healthScore.$gte = filter.filters.healthScore.min;
      }
      if (filter.filters.healthScore.max) {
        query.healthScore.$lte = filter.filters.healthScore.max;
      }
    }

    // Date range
    if (filter.filters.dateRange) {
      query.createdAt = {};
      if (filter.filters.dateRange.startDate) {
        query.createdAt.$gte = new Date(filter.filters.dateRange.startDate);
      }
      if (filter.filters.dateRange.endDate) {
        query.createdAt.$lte = new Date(filter.filters.dateRange.endDate);
      }
    }

    // Text search
    if (filter.filters.searchText) {
      query.$or = [
        { companyName: { $regex: filter.filters.searchText, $options: 'i' } },
        { contactPerson: { $regex: filter.filters.searchText, $options: 'i' } },
        { email: { $regex: filter.filters.searchText, $options: 'i' } },
      ];
    }

    // Role-based scoping
    if (req.user.role === 'executive') {
      query.assignedTo = req.user._id;
    }

    // Execute query with sorting
    const sort = {};
    const { field = 'createdAt', order = 'desc' } = filter.sorting;
    sort[field] = order === 'desc' ? -1 : 1;

    const leads = await Lead.find(query)
      .populate('assignedTo', 'name email role avatar')
      .sort(sort)
      .limit(100);

    res.json({
      filter,
      leads,
      count: leads.length,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete saved filter
// @route   DELETE /api/filters/:id
// @access  Private
export const deleteSavedFilter = async (req, res, next) => {
  try {
    const filter = await SavedFilter.findById(req.params.id);

    if (!filter) {
      res.status(404);
      throw new Error('Filter not found');
    }

    // Check ownership
    if (filter.createdBy.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Only filter owner can delete');
    }

    await SavedFilter.findByIdAndDelete(req.params.id);
    res.json({ message: 'Filter deleted successfully' });
  } catch (error) {
    next(error);
  }
};
