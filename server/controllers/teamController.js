import Lead from '../models/Lead.js';
import User from '../models/User.js';
import Activity from '../models/Activity.js';
import Task from '../models/Task.js';
import mongoose from 'mongoose';

// @desc    Get team performance report
// @route   GET /api/team/performance
// @access  Private/Admin/Manager
export const getTeamPerformance = async (req, res, next) => {
  try {
    const performance = await Lead.aggregate([
      { $match: { isArchived: false } },
      {
        $group: {
          _id: '$assignedTo',
          leadsAssigned: { $sum: 1 },
          leadsConverted: { $sum: { $cond: [{ $eq: ['$status', 'won'] }, 1, 0] } },
          leadsLost: { $sum: { $cond: [{ $eq: ['$status', 'lost'] }, 1, 0] } },
          revenueGenerated: { $sum: '$closedRevenue' },
          expectedRevenue: { $sum: { $cond: [{ $nin: ['$status', ['won', 'lost']] }, '$expectedRevenue', 0] } }
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
          _id: 1,
          name: { $ifNull: ['$user.name', 'Unassigned'] },
          avatar: { $ifNull: ['$user.avatar', ''] },
          department: { $ifNull: ['$user.department', 'Sales'] },
          leadsAssigned: 1,
          leadsConverted: 1,
          revenueGenerated: 1,
          expectedRevenue: 1,
          conversionPercentage: {
            $cond: [
              { $gt: [{ $add: ['$leadsConverted', '$leadsLost'] }, 0] },
              { $round: [{ $multiply: [{ $divide: ['$leadsConverted', { $add: ['$leadsConverted', '$leadsLost'] }] }, 100] }, 1] },
              0
            ]
          }
        }
      },
      { $sort: { revenueGenerated: -1 } }
    ]);

    // Retrieve task metrics (completed followups) per user
    const taskMetrics = await Task.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: '$assignedTo', followupsCompleted: { $sum: 1 } } }
    ]);

    // Zip performance and tasks metrics
    const finalReport = performance.map(perf => {
      const task = taskMetrics.find(t => t._id?.toString() === perf._id?.toString());
      return {
        ...perf,
        followupsCompleted: task ? task.followupsCompleted : 0
      };
    });

    res.json(finalReport);
  } catch (error) {
    next(error);
  }
};

// @desc    Get leaderboard rankings
// @route   GET /api/team/leaderboard
// @access  Private
export const getLeaderboard = async (req, res, next) => {
  try {
    // Leaderboard aggregates closed deals values for the executive
    const leaderboard = await Lead.aggregate([
      { $match: { isArchived: false, status: 'won' } },
      {
        $group: {
          _id: '$assignedTo',
          revenueGenerated: { $sum: '$closedRevenue' },
          dealsWon: { $sum: 1 }
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
      { $unwind: '$user' },
      {
        $project: {
          _id: 1,
          name: '$user.name',
          avatar: '$user.avatar',
          revenueGenerated: 1,
          dealsWon: 1
        }
      },
      { $sort: { revenueGenerated: -1 } }
    ]);

    res.json(leaderboard);
  } catch (error) {
    next(error);
  }
};

// @desc    Get contribution heatmap activity for a user
// @route   GET /api/team/heatmap/:userId
// @access  Private
export const getUserContributionHeatmap = async (req, res, next) => {
  const userId = req.params.userId === 'me' ? req.user._id : new mongoose.Types.ObjectId(req.params.userId);

  try {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const activityHeatmap = await Activity.aggregate([
      {
        $match: {
          user: userId,
          createdAt: { $gte: oneYearAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Formatted as { '2026-05-20': 5, '2026-05-21': 3 }
    const heatmapObj = {};
    activityHeatmap.forEach(item => {
      heatmapObj[item._id] = item.count;
    });

    res.json(heatmapObj);
  } catch (error) {
    next(error);
  }
};
