import Lead from '../models/Lead.js';
import Task from '../models/Task.js';
import Activity from '../models/Activity.js';
import User from '../models/User.js';

// Helper to compute Lead Health Score on the fly
const calculateHealthScore = async (lead) => {
  let score = 50; // Start baseline midpoint

  // 1. Pipeline Stage (later stages get positive boost)
  const stageWeights = {
    lead: 10,
    contacted: 25,
    qualified: 50,
    proposal_sent: 70,
    negotiation: 85,
    won: 100,
    lost: 0
  };
  const stageScore = stageWeights[lead.status] || 10;
  score = stageScore;

  if (lead.status === 'won') return 100;
  if (lead.status === 'lost') return 0;

  // 2. Activity frequency (activities in the last 7 days boost score)
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const recentActivities = await Activity.countDocuments({
    lead: lead._id,
    createdAt: { $gte: oneWeekAgo }
  });
  score += Math.min(recentActivities * 10, 25); // max 25% weight boost

  // 3. Followup frequency (any pending tasks?)
  const now = new Date();
  const pendingTasks = await Task.countDocuments({
    lead: lead._id,
    status: 'pending',
    dueDate: { $gte: now }
  });
  if (pendingTasks > 0) {
    score += 15; // Positive boost if a follow-up is scheduled
  }

  // 4. Overdue tasks (negative penalties)
  const overdueTasks = await Task.countDocuments({
    lead: lead._id,
    status: 'overdue'
  });
  if (overdueTasks > 0) {
    score -= overdueTasks * 15; // Penalty per missed deadline
  }

  // 5. High revenue adjustment
  if (lead.expectedRevenue > 250000) {
    score += 10; // Extra attention boosts scores
  }

  // Clamp score in bounds 0-100
  const finalScore = Math.min(Math.max(score, 0), 100);

  // Sync to database
  lead.healthScore = finalScore;
  await lead.save();

  return finalScore;
};

// @desc    Get AI Recommendations panel
// @route   GET /api/smart/recommendations
// @access  Private
export const getRecommendations = async (req, res, next) => {
  try {
    const matchQuery = { isArchived: false, status: { $nin: ['won', 'lost'] } };
    if (req.user.role === 'executive') {
      matchQuery.assignedTo = req.user._id;
    }

    const leads = await Lead.find(matchQuery);

    const now = new Date();
    const staleLimit = new Date();
    staleLimit.setDate(staleLimit.getDate() - 15); // Stale threshold: 15 days

    const attentionNeeded = [];
    const staleLeads = [];
    const highConversionProbable = [];
    const atRisk = [];

    for (const lead of leads) {
      // Refresh score
      const score = await calculateHealthScore(lead);

      // Check last activity timestamp
      const lastActivity = await Activity.findOne({ lead: lead._id }).sort({ createdAt: -1 });
      const lastActivityDate = lastActivity ? lastActivity.createdAt : lead.createdAt;

      const daysInactive = Math.ceil((now - new Date(lastActivityDate)) / (1000 * 60 * 60 * 24));

      // Stale Category
      if (daysInactive >= 15) {
        staleLeads.push({
          _id: lead._id,
          companyName: lead.companyName,
          contactPerson: lead.contactPerson,
          daysInactive,
          assignedTo: lead.assignedTo,
          status: lead.status
        });
      }

      // Needs Attention (inactive for 7-14 days or health score < 40)
      else if (daysInactive >= 7 || score < 40) {
        attentionNeeded.push({
          _id: lead._id,
          companyName: lead.companyName,
          contactPerson: lead.contactPerson,
          daysInactive,
          healthScore: score,
          status: lead.status
        });
      }

      // High Conversion Likely (health score > 75 and stage qualified/proposal/negotiation)
      if (score >= 75 && ['qualified', 'proposal_sent', 'negotiation'].includes(lead.status)) {
        highConversionProbable.push({
          _id: lead._id,
          companyName: lead.companyName,
          contactPerson: lead.contactPerson,
          healthScore: score,
          expectedRevenue: lead.expectedRevenue,
          status: lead.status
        });
      }

      // At Risk (overdue tasks or health score < 30)
      const hasOverdue = await Task.countDocuments({ lead: lead._id, status: 'overdue' });
      if (hasOverdue > 0 || score < 30) {
        atRisk.push({
          _id: lead._id,
          companyName: lead.companyName,
          contactPerson: lead.contactPerson,
          healthScore: score,
          expectedRevenue: lead.expectedRevenue,
          reason: hasOverdue > 0 ? 'Has overdue follow-ups' : 'Critically low health score',
          status: lead.status
        });
      }
    }

    res.json({
      attentionNeeded: attentionNeeded.slice(0, 5),
      staleLeads: staleLeads.slice(0, 5),
      highConversionProbable: highConversionProbable.slice(0, 5),
      atRisk: atRisk.slice(0, 5),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Revenue Forecasting
// @route   GET /api/smart/revenue-forecast
// @access  Private
export const getRevenueForecast = async (req, res, next) => {
  try {
    const matchQuery = { isArchived: false };
    if (req.user.role === 'executive') {
      matchQuery.assignedTo = req.user._id;
    }

    const leads = await Lead.find(matchQuery);

    let expectedRevenue = 0;
    let closedRevenue = 0;
    let forecastRevenue = 0;

    leads.forEach(lead => {
      if (lead.status === 'won') {
        closedRevenue += lead.closedRevenue || lead.expectedRevenue;
      } else if (lead.status !== 'lost') {
        expectedRevenue += lead.expectedRevenue;
        
        // Probability weight conversion
        const probabilityDecimal = lead.probability / 100;
        forecastRevenue += lead.expectedRevenue * probabilityDecimal;
      }
    });

    res.json({
      expectedRevenue: Math.round(expectedRevenue),
      closedRevenue: Math.round(closedRevenue),
      forecastRevenue: Math.round(forecastRevenue),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Lead Aging Metrics
// @route   GET /api/smart/lead-aging
// @access  Private
export const getLeadAging = async (req, res, next) => {
  try {
    const matchQuery = { isArchived: false, status: { $nin: ['won', 'lost'] } };
    if (req.user.role === 'executive') {
      matchQuery.assignedTo = req.user._id;
    }

    const leads = await Lead.find(matchQuery).select('companyName contactPerson status stageEnteredAt createdAt assignedTo');

    const now = new Date();
    
    const agingData = leads.map(lead => {
      const daysInStage = Math.ceil((now - new Date(lead.stageEnteredAt)) / (1000 * 60 * 60 * 24));
      const totalAge = Math.ceil((now - new Date(lead.createdAt)) / (1000 * 60 * 60 * 24));

      // Escalation Alert Check
      let needsEscalation = false;
      if (lead.status === 'lead' && daysInStage > 7) needsEscalation = true;
      if (lead.status === 'contacted' && daysInStage > 5) needsEscalation = true;
      if (lead.status === 'qualified' && daysInStage > 10) needsEscalation = true;
      if (lead.status === 'proposal_sent' && daysInStage > 12) needsEscalation = true;
      if (lead.status === 'negotiation' && daysInStage > 15) needsEscalation = true;

      return {
        _id: lead._id,
        companyName: lead.companyName,
        contactPerson: lead.contactPerson,
        status: lead.status,
        daysInStage,
        totalAge,
        needsEscalation
      };
    });

    // Sort by days in stage descending
    agingData.sort((a, b) => b.daysInStage - a.daysInStage);

    res.json(agingData);
  } catch (error) {
    next(error);
  }
};
