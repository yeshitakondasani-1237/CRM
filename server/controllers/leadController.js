import Lead from '../models/Lead.js';
import Activity from '../models/Activity.js';
import User from '../models/User.js';

// @desc    Get all leads with filtering, sorting, pagination
// @route   GET /api/leads
// @access  Private
export const getLeads = async (req, res, next) => {
  try {
    const { 
      status, 
      assignedTo, 
      priority, 
      search, 
      minRevenue, 
      maxRevenue, 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      page = 1,
      limit = 100,
      isArchived = false
    } = req.query;

    const query = { isArchived: isArchived === 'true' };

    // Role-based scoping: Sales Executives can only see their own assigned leads, Managers/Admins see all
    if (req.user.role === 'executive') {
      query.assignedTo = req.user._id;
    } else if (assignedTo) {
      query.assignedTo = assignedTo;
    }

    // Status filtration (supports comma separated or single values)
    if (status) {
      query.status = status.includes(',') ? { $in: status.split(',') } : status;
    }

    // Priority filtration
    if (priority) {
      query.priority = priority;
    }

    // Expected Revenue filtration
    if (minRevenue || maxRevenue) {
      query.expectedRevenue = {};
      if (minRevenue) query.expectedRevenue.$gte = Number(minRevenue);
      if (maxRevenue) query.expectedRevenue.$lte = Number(maxRevenue);
    }

    // Text search (Company, Contact, Email)
    if (search) {
      query.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        { contactPerson: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Sorting
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const leads = await Lead.find(query)
      .populate('assignedTo', 'name email role avatar')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const totalLeads = await Lead.countDocuments(query);

    res.json({
      leads,
      page: Number(page),
      pages: Math.ceil(totalLeads / Number(limit)),
      total: totalLeads
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single lead detail with history and activities
// @route   GET /api/leads/:id
// @access  Private
export const getLeadById = async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate('assignedTo', 'name email role avatar')
      .populate({
        path: 'statusHistory.changedBy',
        select: 'name email role'
      });

    if (!lead) {
      res.status(404);
      throw new Error('Lead not found');
    }

    // Verify ownership for Sales Executive
    if (req.user.role === 'executive' && lead.assignedTo?._id.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Access denied to this lead profile');
    }

    // Populate associated activities in chronological order
    const activities = await Activity.find({ lead: lead._id })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 });

    res.json({
      lead,
      activities
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new lead
// @route   POST /api/leads
// @access  Private
export const createLead = async (req, res, next) => {
  const { 
    companyName, contactPerson, email, phone, 
    industry, location, source, priority, 
    expectedRevenue, notes, assignedTo, tags 
  } = req.body;

  try {
    // Default probability mapping based on initial 'lead' status
    const initialProbability = 10; 

    // Auto-assign to current user if not specified and current user is an Executive
    let assignee = assignedTo;
    if (!assignee && req.user.role === 'executive') {
      assignee = req.user._id;
    }

    const lead = new Lead({
      companyName,
      contactPerson,
      email,
      phone,
      industry,
      location,
      source: source || 'Other',
      status: 'lead',
      priority: priority || 'medium',
      expectedRevenue: expectedRevenue || 0,
      probability: initialProbability,
      assignedTo: assignee,
      tags: tags || [],
      notes: notes || '',
      healthScore: 50, // Standard baseline
      stageEnteredAt: new Date()
    });

    // Seed initial status history entry
    lead.statusHistory.push({
      status: 'lead',
      changedAt: new Date(),
      changedBy: req.user._id
    });

    const createdLead = await lead.save();

    // Create activity timeline entry
    await Activity.create({
      lead: createdLead._id,
      user: req.user._id,
      type: 'status_change',
      title: 'Lead Created',
      description: `Lead created by ${req.user.name} and stage set to 'Lead'.`
    });

    res.status(201).json(createdLead);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a lead details / pipeline stage
// @route   PUT /api/leads/:id
// @access  Private
export const updateLead = async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      res.status(404);
      throw new Error('Lead not found');
    }

    // Verify ownership for Sales Executive
    if (req.user.role === 'executive' && lead.assignedTo?.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Access denied: You are not assigned to this lead');
    }

    const oldStatus = lead.status;
    const newStatus = req.body.status;

    // Track status history if pipeline stage changed
    if (newStatus && newStatus !== oldStatus) {
      lead.status = newStatus;
      lead.stageEnteredAt = new Date();
      
      // Dynamic probability scoring based on pipeline phase
      const stageProbabilities = {
        lead: 10,
        contacted: 20,
        qualified: 40,
        proposal_sent: 60,
        negotiation: 80,
        won: 100,
        lost: 0
      };
      
      lead.probability = stageProbabilities[newStatus] !== undefined 
        ? stageProbabilities[newStatus] 
        : lead.probability;

      // Handle won/lost closed revenues
      if (newStatus === 'won') {
        lead.closedRevenue = req.body.closedRevenue || lead.expectedRevenue;
      } else if (newStatus === 'lost') {
        lead.closedRevenue = 0;
      }

      lead.statusHistory.push({
        status: newStatus,
        changedAt: new Date(),
        changedBy: req.user._id
      });

      // Log status transition timeline activity
      await Activity.create({
        lead: lead._id,
        user: req.user._id,
        type: 'status_change',
        title: `Pipeline Stage Updated`,
        description: `Pipeline stage moved from '${oldStatus}' to '${newStatus}' by ${req.user.name}.`
      });
    }

    // Update other fields
    lead.companyName = req.body.companyName || lead.companyName;
    lead.contactPerson = req.body.contactPerson || lead.contactPerson;
    lead.email = req.body.email || lead.email;
    lead.phone = req.body.phone !== undefined ? req.body.phone : lead.phone;
    lead.industry = req.body.industry !== undefined ? req.body.industry : lead.industry;
    lead.location = req.body.location !== undefined ? req.body.location : lead.location;
    lead.source = req.body.source || lead.source;
    lead.priority = req.body.priority || lead.priority;
    lead.expectedRevenue = req.body.expectedRevenue !== undefined ? req.body.expectedRevenue : lead.expectedRevenue;
    lead.notes = req.body.notes !== undefined ? req.body.notes : lead.notes;
    lead.assignedTo = req.body.assignedTo || lead.assignedTo;
    lead.tags = req.body.tags !== undefined ? req.body.tags : lead.tags;

    if (req.body.healthScore !== undefined) {
      lead.healthScore = req.body.healthScore;
    }

    const updatedLead = await lead.save();
    res.json(updatedLead);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete lead
// @route   DELETE /api/leads/:id
// @access  Private/Admin/Manager
export const deleteLead = async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      res.status(404);
      throw new Error('Lead not found');
    }

    // Delete lead from database
    await lead.deleteOne();
    
    // Cleanup related activities & tasks
    await Activity.deleteMany({ lead: req.params.id });

    res.json({ message: 'Lead and associated logs removed successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Archive lead toggle
// @route   PUT /api/leads/:id/archive
// @access  Private
export const archiveLead = async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      res.status(404);
      throw new Error('Lead not found');
    }

    // Toggle archived status
    lead.isArchived = !lead.isArchived;
    await lead.save();

    await Activity.create({
      lead: lead._id,
      user: req.user._id,
      type: 'note',
      title: lead.isArchived ? 'Lead Archived' : 'Lead Restored',
      description: `Lead was ${lead.isArchived ? 'archived' : 'restored'} by ${req.user.name}.`
    });

    res.json(lead);
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk CSV Export
// @route   GET /api/leads/export
// @access  Private/Admin/Manager
export const exportLeads = async (req, res, next) => {
  try {
    const leads = await Lead.find({ isArchived: false }).populate('assignedTo', 'name');
    
    // Build CSV content
    const headers = ['Company Name', 'Contact Person', 'Email', 'Phone', 'Industry', 'Location', 'Source', 'Status', 'Priority', 'Expected Revenue', 'Assigned Executive', 'Health Score', 'Created At'];
    
    let csvContent = headers.join(',') + '\n';
    
    leads.forEach(lead => {
      const row = [
        `"${lead.companyName.replace(/"/g, '""')}"`,
        `"${lead.contactPerson.replace(/"/g, '""')}"`,
        `"${lead.email}"`,
        `"${lead.phone}"`,
        `"${lead.industry}"`,
        `"${lead.location}"`,
        `"${lead.source}"`,
        `"${lead.status}"`,
        `"${lead.priority}"`,
        lead.expectedRevenue,
        `"${lead.assignedTo ? lead.assignedTo.name : 'Unassigned'}"`,
        lead.healthScore,
        lead.createdAt.toISOString()
      ];
      csvContent += row.join(',') + '\n';
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=leads_export.csv');
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk CSV Import
// @route   POST /api/leads/import
// @access  Private/Admin/Manager
export const importLeads = async (req, res, next) => {
  // Simplistic JSON body list import for modern APIs (ideal for portfolios)
  const leadsList = req.body.leads; // Expect array of leads
  if (!leadsList || !Array.isArray(leadsList)) {
    res.status(400);
    throw new Error('Please provide an array of leads to import');
  }

  try {
    const leadsToInsert = leadsList.map(lead => ({
      companyName: lead.companyName,
      contactPerson: lead.contactPerson,
      email: lead.email,
      phone: lead.phone || '',
      industry: lead.industry || '',
      location: lead.location || '',
      source: lead.source || 'Other',
      status: 'lead',
      priority: lead.priority || 'medium',
      expectedRevenue: Number(lead.expectedRevenue) || 0,
      assignedTo: lead.assignedTo || req.user._id,
      notes: lead.notes || 'Bulk imported.',
      stageEnteredAt: new Date(),
      statusHistory: [{ status: 'lead', changedAt: new Date(), changedBy: req.user._id }]
    }));

    const insertedLeads = await Lead.insertMany(leadsToInsert);
    
    // Log seeding activities
    for (const lead of insertedLeads) {
      await Activity.create({
        lead: lead._id,
        user: req.user._id,
        type: 'status_change',
        title: 'Lead Imported',
        description: 'Lead imported via bulk operations.'
      });
    }

    res.status(201).json({
      message: `${insertedLeads.length} leads imported successfully.`,
      leads: insertedLeads
    });
  } catch (error) {
    next(error);
  }
};
