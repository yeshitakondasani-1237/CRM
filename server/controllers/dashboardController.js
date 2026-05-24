import Lead from '../models/Lead.js';
import Task from '../models/Task.js';
import Activity from '../models/Activity.js';
import mongoose from 'mongoose';

// @desc    Get dashboard KPIs
// @route   GET /api/dashboard/kpis
// @access  Private
export const getKPIs = async (req, res, next) => {
  try {
    const matchQuery = { isArchived: false };

    // Executive isolation
    if (req.user.role === 'executive') {
      matchQuery.assignedTo = req.user._id;
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Run aggregations in parallel to maximize database performance
    const [
      totalCounts,
      newThisMonth,
      revenueMetrics,
      conversionRates
    ] = await Promise.all([
      // Total leads, won, lost, qualified
      Lead.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            won: { $sum: { $cond: [{ $eq: ['$status', 'won'] }, 1, 0] } },
            lost: { $sum: { $cond: [{ $eq: ['$status', 'lost'] }, 1, 0] } },
            qualified: { $sum: { $cond: [{ $in: ['$status', ['qualified', 'proposal_sent', 'negotiation']] }, 1, 0] } }
          }
        }
      ]),
      // New leads this month
      Lead.countDocuments({
        ...matchQuery,
        createdAt: { $gte: startOfMonth }
      }),
      // Expected vs Closed Revenues
      Lead.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: null,
            expectedRevenue: { $sum: { $cond: [{ $nin: ['$status', ['won', 'lost']] }, '$expectedRevenue', 0] } },
            closedRevenue: { $sum: '$closedRevenue' }
          }
        }
      ]),
      // Conversion Rate calculations
      Lead.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: null,
            won: { $sum: { $cond: [{ $eq: ['$status', 'won'] }, 1, 0] } },
            closedTotal: { $sum: { $cond: [{ $in: ['$status', ['won', 'lost']] }, 1, 0] } }
          }
        }
      ])
    ]);

    const counts = totalCounts[0] || { total: 0, won: 0, lost: 0, qualified: 0 };
    const revs = revenueMetrics[0] || { expectedRevenue: 0, closedRevenue: 0 };
    const conv = conversionRates[0] || { won: 0, closedTotal: 0 };

    const conversionRate = conv.closedTotal > 0 
      ? Math.round((conv.won / conv.closedTotal) * 100) 
      : 0;

    res.json({
      totalLeads: counts.total,
      newLeadsThisMonth: newThisMonth,
      qualifiedLeads: counts.qualified,
      wonDeals: counts.won,
      lostDeals: counts.lost,
      conversionRate,
      expectedRevenue: revs.expectedRevenue,
      revenueClosed: revs.closedRevenue
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard chart aggregates
// @route   GET /api/dashboard/charts
// @access  Private
export const getCharts = async (req, res, next) => {
  try {
    const matchQuery = { isArchived: false };

    if (req.user.role === 'executive') {
      matchQuery.assignedTo = req.user._id;
    }

    const [
      leadsByStatus,
      monthlyLeadGeneration,
      revenueTrend,
      salesPerformance,
      leadSourceDistribution
    ] = await Promise.all([
      // 1. Leads by status
      Lead.aggregate([
        { $match: matchQuery },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      
      // 2. Monthly lead generation trend (past 6 months)
      Lead.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 6 }
      ]),

      // 3. Expected vs Closed Revenue monthly trend
      Lead.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            expected: { $sum: { $cond: [{ $nin: ['$status', ['won', 'lost']] }, '$expectedRevenue', 0] } },
            closed: { $sum: '$closedRevenue' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 6 }
      ]),

      // 4. Sales performance by Executive (Admin/Manager sees all, Executive sees self)
      Lead.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: '$assignedTo',
            leadsCount: { $sum: 1 },
            wonCount: { $sum: { $cond: [{ $eq: ['$status', 'won'] }, 1, 0] } },
            closedRevenue: { $sum: '$closedRevenue' }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            name: { $ifNull: ['$user.name', 'Unassigned'] },
            leadsCount: 1,
            wonCount: 1,
            closedRevenue: 1
          }
        },
        { $sort: { closedRevenue: -1 } }
      ]),

      // 5. Lead Source Distribution
      Lead.aggregate([
        { $match: matchQuery },
        { $group: { _id: '$source', count: { $sum: 1 } } }
      ])
    ]);

    // Format monthly templates for simpler client parsing
    const monthNames = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    const formattedLeadTrend = monthlyLeadGeneration.map(item => ({
      name: `${monthNames[item._id.month]} ${item._id.year}`,
      leads: item.count
    }));

    const formattedRevenueTrend = revenueTrend.map(item => ({
      name: `${monthNames[item._id.month]} ${item._id.year}`,
      expected: item.expected,
      closed: item.closed
    }));

    res.json({
      leadsByStatus: leadsByStatus.map(item => ({ name: item._id, value: item.count })),
      leadTrend: formattedLeadTrend,
      revenueTrend: formattedRevenueTrend,
      salesPerformance,
      sourceDistribution: leadSourceDistribution.map(item => ({ name: item._id, value: item.count }))
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard widgets summaries
// @route   GET /api/dashboard/widgets
// @access  Private
export const getWidgets = async (req, res, next) => {
  try {
    const matchQuery = {};
    if (req.user.role === 'executive') {
      matchQuery.assignedTo = req.user._id;
    }

    const now = new Date();

    const [
      upcomingFollowups,
      recentActivities,
      highPriorityLeads
    ] = await Promise.all([
      // 1. Upcoming followups (due within the next 7 days, sorted earliest first)
      Task.find({
        ...matchQuery,
        status: 'pending',
        dueDate: { $gte: now }
      })
        .populate('lead', 'companyName contactPerson')
        .sort({ dueDate: 1 })
        .limit(5),

      // 2. Recent activities (past 10 logs)
      Activity.find(
        req.user.role === 'executive' 
          ? { user: req.user._id } 
          : {}
      )
        .populate('lead', 'companyName')
        .populate('user', 'name avatar')
        .sort({ createdAt: -1 })
        .limit(6),

      // 3. High priority leads
      Lead.find({
        ...matchQuery,
        isArchived: false,
        status: { $nin: ['won', 'lost'] },
        priority: { $in: ['high', 'critical'] }
      })
        .select('companyName contactPerson expectedRevenue priority healthScore status')
        .sort({ expectedRevenue: -1 })
        .limit(5)
    ]);

    res.json({
      upcomingFollowups,
      recentActivities,
      highPriorityLeads
    });
  } catch (error) {
    next(error);
  }
};
