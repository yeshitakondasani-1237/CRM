import Report from '../models/Report.js';
import Lead from '../models/Lead.js';
import User from '../models/User.js';
import Task from '../models/Task.js';

// @desc    Generate report data and cache
// @route   POST /api/reports
// @access  Private/Admin/Manager
export const generateReport = async (req, res, next) => {
  const { type, title, filters, format } = req.body;

  try {
    let reportData = {};

    if (type === 'lead') {
      const matchQuery = { isArchived: false };
      if (filters?.status) matchQuery.status = filters.status;
      if (filters?.priority) matchQuery.priority = filters.priority;

      const leads = await Lead.find(matchQuery)
        .populate('assignedTo', 'name email')
        .sort({ createdAt: -1 });

      reportData = {
        totalLeads: leads.length,
        wonLeads: leads.filter(l => l.status === 'won').length,
        lostLeads: leads.filter(l => l.status === 'lost').length,
        activeLeads: leads.filter(l => !['won', 'lost'].includes(l.status)).length,
        leads: leads.map(l => ({
          companyName: l.companyName,
          contactPerson: l.contactPerson,
          email: l.email,
          status: l.status,
          priority: l.priority,
          expectedRevenue: l.expectedRevenue,
          assignedTo: l.assignedTo ? l.assignedTo.name : 'Unassigned',
          healthScore: l.healthScore,
          createdAt: l.createdAt
        }))
      };
    } else if (type === 'revenue') {
      const leads = await Lead.find({ isArchived: false });
      
      let expectedTotal = 0;
      let closedTotal = 0;
      const byStage = {};

      leads.forEach(l => {
        if (l.status === 'won') {
          closedTotal += l.closedRevenue || l.expectedRevenue;
        } else if (l.status !== 'lost') {
          expectedTotal += l.expectedRevenue;
        }

        byStage[l.status] = (byStage[l.status] || 0) + (l.status === 'won' ? l.closedRevenue : l.expectedRevenue);
      });

      reportData = {
        expectedRevenueTotal: expectedTotal,
        closedRevenueTotal: closedTotal,
        stageBreakdown: byStage,
        dateGenerated: new Date()
      };
    } else if (type === 'performance') {
      const executives = await User.find({ role: 'executive' });
      const executiveMetrics = [];

      for (const exec of executives) {
        const leads = await Lead.find({ assignedTo: exec._id, isArchived: false });
        const wonCount = leads.filter(l => l.status === 'won').length;
        const lostCount = leads.filter(l => l.status === 'lost').length;
        const closedRev = leads.reduce((sum, l) => sum + (l.closedRevenue || 0), 0);

        const tasksCompleted = await Task.countDocuments({
          assignedTo: exec._id,
          status: 'completed'
        });

        const totalClosed = wonCount + lostCount;
        const conversionRate = totalClosed > 0 ? Math.round((wonCount / totalClosed) * 100) : 0;

        executiveMetrics.push({
          name: exec.name,
          email: exec.email,
          department: exec.department,
          leadsAssigned: leads.length,
          dealsWon: wonCount,
          dealsLost: lostCount,
          revenueGenerated: closedRev,
          conversionRate,
          followupsCompleted: tasksCompleted
        });
      }

      reportData = {
        executivesCount: executives.length,
        metrics: executiveMetrics.sort((a, b) => b.revenueGenerated - a.revenueGenerated)
      };
    } else {
      res.status(400);
      throw new Error('Unsupported report type requested');
    }

    const report = new Report({
      generatedBy: req.user._id,
      type,
      title: title || `Seeded BDA CRM ${type} Report`,
      filters: filters || {},
      data: reportData,
      format: format || 'pdf'
    });

    const savedReport = await report.save();
    res.status(201).json(savedReport);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reports history list
// @route   GET /api/reports
// @access  Private/Admin/Manager
export const getReportsList = async (req, res, next) => {
  try {
    const reports = await Report.find({})
      .populate('generatedBy', 'name email role')
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (error) {
    next(error);
  }
};
