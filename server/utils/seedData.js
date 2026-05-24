import mongoose from 'mongoose';
import User from '../models/User.js';
import Lead from '../models/Lead.js';
import Activity from '../models/Activity.js';
import Task from '../models/Task.js';
import Notification from '../models/Notification.js';

const seedData = async () => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Lead.deleteMany({});
    await Activity.deleteMany({});
    await Task.deleteMany({});
    await Notification.deleteMany({});

    console.log('Database cleared for seeding...');

    // 1. Seed Users
    const users = await User.create([
      {
        name: 'John Doe',
        email: 'admin@manufacturing.com',
        password: 'password123',
        role: 'admin',
        phone: '1234567890',
        department: 'Management',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      },
      {
        name: 'Sarah Smith',
        email: 'manager@manufacturing.com',
        password: 'password123',
        role: 'manager',
        phone: '2345678901',
        department: 'Business Development',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      },
      {
        name: 'Michael Scott',
        email: 'executive1@manufacturing.com',
        password: 'password123',
        role: 'executive',
        phone: '3456789012',
        department: 'Sales',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      },
      {
        name: 'Dwight Schrute',
        email: 'executive2@manufacturing.com',
        password: 'password123',
        role: 'executive',
        phone: '4567890123',
        department: 'Sales',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      },
    ]);

    const admin = users[0];
    const manager = users[1];
    const exec1 = users[2];
    const exec2 = users[3];

    console.log(`${users.length} users created.`);

    // 2. Seed Leads (with manufacturing domain focus)
    const leadTemplates = [
      {
        companyName: 'Apex Automotive Systems',
        contactPerson: 'Alex Rivera',
        email: 'arivera@apexauto.com',
        phone: '555-0199',
        industry: 'Automotive',
        location: 'Detroit, MI',
        source: 'LinkedIn',
        status: 'lead',
        priority: 'high',
        expectedRevenue: 150000,
        probability: 10,
        assignedTo: exec1._id,
        notes: 'Interested in bulk casting supplies for their EV chassis components.',
        healthScore: 65,
      },
      {
        companyName: 'BriteTech Aerospace',
        contactPerson: 'Elena Rostova',
        email: 'erostova@britetech.io',
        phone: '555-0142',
        industry: 'Aerospace',
        location: 'Seattle, WA',
        source: 'Trade Show',
        status: 'contacted',
        priority: 'critical',
        expectedRevenue: 380000,
        probability: 20,
        assignedTo: exec1._id,
        notes: 'Met at Aerospace Expo. Highly interested in high-grade alloy stampings.',
        healthScore: 78,
      },
      {
        companyName: 'Custom CNC Gearworks',
        contactPerson: 'Marcus Brody',
        email: 'brody@cncgearworks.com',
        phone: '555-0187',
        industry: 'Heavy Machinery',
        location: 'Chicago, IL',
        source: 'Referral',
        status: 'qualified',
        priority: 'medium',
        expectedRevenue: 85000,
        probability: 40,
        assignedTo: exec2._id,
        notes: 'Requires customized hydraulic couplings. Passed technical validation.',
        healthScore: 82,
      },
      {
        companyName: 'Delta Packaging Solutions',
        contactPerson: 'Sarah Jenkins',
        email: 'sjenkins@deltapack.com',
        phone: '555-0164',
        industry: 'Packaging',
        location: 'Atlanta, GA',
        source: 'Website',
        status: 'proposal_sent',
        priority: 'high',
        expectedRevenue: 120000,
        probability: 60,
        assignedTo: exec2._id,
        notes: 'Proposal sent for food-grade steel molding tooling. Waiting for review.',
        healthScore: 88,
      },
      {
        companyName: 'EcoPower Turbine Corp',
        contactPerson: 'Danielle Cole',
        email: 'dcole@ecopowerturbines.com',
        phone: '555-0121',
        industry: 'Energy',
        location: 'Austin, TX',
        source: 'Email Campaign',
        status: 'negotiation',
        priority: 'critical',
        expectedRevenue: 450000,
        probability: 80,
        assignedTo: exec1._id,
        notes: 'Price negotiation on massive forging rotor units. Contract drafts shared.',
        healthScore: 92,
      },
      {
        companyName: 'Future Plastics Group',
        contactPerson: 'Peter Parker',
        email: 'pparker@futureplastics.net',
        phone: '555-0111',
        industry: 'Chemicals',
        location: 'New York, NY',
        source: 'Cold Call',
        status: 'won',
        priority: 'medium',
        expectedRevenue: 95000,
        closedRevenue: 95000,
        probability: 100,
        assignedTo: exec2._id,
        notes: 'Closed deal for standard polymer extrusions tooling.',
        healthScore: 95,
      },
      {
        companyName: 'Global Heavy Castings',
        contactPerson: 'Bruce Banner',
        email: 'bbanner@globalcastings.org',
        phone: '555-0144',
        industry: 'Heavy Machinery',
        location: 'Denver, CO',
        source: 'LinkedIn',
        status: 'lost',
        priority: 'high',
        expectedRevenue: 280000,
        probability: 0,
        assignedTo: exec1._id,
        notes: 'Lost to local competitor who offered faster delivery cycles.',
        healthScore: 15,
      },
      {
        companyName: 'Heliocentric Solar Panels',
        contactPerson: 'Tony Stark',
        email: 'tstark@heliocentric.com',
        phone: '555-0100',
        industry: 'Energy',
        location: 'Los Angeles, CA',
        source: 'Website',
        status: 'lead',
        priority: 'high',
        expectedRevenue: 220000,
        probability: 10,
        assignedTo: exec2._id,
        notes: 'Inquired about customized aluminum mounts. Stale for 5 days.',
        healthScore: 48,
      },
      {
        companyName: 'Ironclad Safe & Vaults',
        contactPerson: 'Pepper Potts',
        email: 'ppotts@ironclad.com',
        phone: '555-0133',
        industry: 'Consumer Goods',
        location: 'Columbus, OH',
        source: 'Referral',
        status: 'contacted',
        priority: 'low',
        expectedRevenue: 45000,
        probability: 20,
        assignedTo: exec1._id,
        notes: 'Initial discussion on steel door sheets supply. Price-sensitive.',
        healthScore: 52,
      },
      {
        companyName: 'Jupiter Logistics Gear',
        contactPerson: 'Diana Prince',
        email: 'dprince@jupiterlogistics.com',
        phone: '555-0155',
        industry: 'Automotive',
        location: 'Dallas, TX',
        source: 'Trade Show',
        status: 'qualified',
        priority: 'high',
        expectedRevenue: 175000,
        probability: 40,
        assignedTo: exec2._id,
        notes: 'Requires structural chassis weldments. Validated technical alignment.',
        healthScore: 80,
      },
    ];

    // Seed more leads to reach 20+ leads
    for (let i = 1; i <= 15; i++) {
      const exec = i % 2 === 0 ? exec1 : exec2;
      const statusOptions = ['lead', 'contacted', 'qualified', 'proposal_sent', 'negotiation', 'won', 'lost'];
      const status = statusOptions[i % statusOptions.length];
      const rev = 50000 + Math.floor(Math.random() * 200000);
      const isWon = status === 'won';
      const isLost = status === 'lost';
      
      leadTemplates.push({
        companyName: `Mfg Lead Enterprise ${i}`,
        contactPerson: `Contact Person ${i}`,
        email: `contact${i}@mfgenterprise${i}.com`,
        phone: `555-02${i}`,
        industry: i % 3 === 0 ? 'Automotive' : i % 3 === 1 ? 'Aerospace' : 'Heavy Machinery',
        location: i % 2 === 0 ? 'Cleveland, OH' : 'Pittsburgh, PA',
        source: ['Website', 'LinkedIn', 'Cold Call', 'Referral'][i % 4],
        status: status,
        priority: ['low', 'medium', 'high', 'critical'][i % 4],
        expectedRevenue: rev,
        closedRevenue: isWon ? rev : 0,
        probability: isWon ? 100 : isLost ? 0 : [10, 20, 40, 60, 80][statusOptions.indexOf(status) % 5],
        assignedTo: exec._id,
        notes: `Automatically seeded manufacturing prospect lead ${i}. Highly prospective.`,
        healthScore: isLost ? 10 : isWon ? 95 : 30 + Math.floor(Math.random() * 60),
      });
    }

    const createdLeads = await Lead.insertMany(leadTemplates);
    console.log(`${createdLeads.length} leads created.`);

    // 3. Seed Activities & Stage History for created leads
    const activities = [];
    
    for (const lead of createdLeads) {
      // Initialize status history
      lead.statusHistory = [
        { status: 'lead', changedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), changedBy: manager._id }
      ];

      // Seed baseline lead creation activity
      activities.push({
        lead: lead._id,
        user: manager._id,
        type: 'status_change',
        title: 'Lead Created',
        description: `Lead created and assigned to ${lead.assignedTo.toString() === exec1._id.toString() ? 'Michael Scott' : 'Dwight Schrute'}.`,
      });

      if (lead.status !== 'lead') {
        lead.statusHistory.push({
          status: 'contacted',
          changedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
          changedBy: lead.assignedTo,
        });

        activities.push({
          lead: lead._id,
          user: lead.assignedTo,
          type: 'call',
          title: 'Initial Discovery Call',
          description: 'Had a productive conversation about manufacturing supply cycles, lead times, and capacity requirements.',
          outcome: 'Completed',
          duration: 15,
        });
      }

      if (['qualified', 'proposal_sent', 'negotiation', 'won', 'lost'].includes(lead.status)) {
        lead.statusHistory.push({
          status: 'qualified',
          changedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          changedBy: lead.assignedTo,
        });

        activities.push({
          lead: lead._id,
          user: lead.assignedTo,
          type: 'meeting',
          title: 'Technical Requirements Alignment',
          description: 'Discussed engineering drawings and alloy specifications with their QA team.',
          outcome: 'Completed',
          duration: 45,
        });
      }

      if (['proposal_sent', 'negotiation', 'won', 'lost'].includes(lead.status)) {
        lead.statusHistory.push({
          status: 'proposal_sent',
          changedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          changedBy: lead.assignedTo,
        });

        activities.push({
          lead: lead._id,
          user: lead.assignedTo,
          type: 'email',
          title: 'Proposal & Commercial Quotation Sent',
          description: 'Shared custom engineering quotes, tooling fees, and bulk pricing tiered sheets.',
          outcome: 'Completed',
        });
      }

      if (['negotiation', 'won', 'lost'].includes(lead.status)) {
        lead.statusHistory.push({
          status: 'negotiation',
          changedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          changedBy: lead.assignedTo,
        });

        activities.push({
          lead: lead._id,
          user: lead.assignedTo,
          type: 'meeting',
          title: 'Contract Pricing Review',
          description: 'In-person meeting at headquarters negotiating credit terms and delivery guarantees.',
          outcome: 'Completed',
          duration: 60,
        });
      }

      if (lead.status === 'won') {
        lead.statusHistory.push({
          status: 'won',
          changedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          changedBy: lead.assignedTo,
        });

        activities.push({
          lead: lead._id,
          user: lead.assignedTo,
          type: 'status_change',
          title: 'Deal Won!',
          description: `Contract countersigned. Revenue of $${lead.expectedRevenue.toLocaleString()} locked. Tooling order initiated.`,
        });
      } else if (lead.status === 'lost') {
        lead.statusHistory.push({
          status: 'lost',
          changedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          changedBy: lead.assignedTo,
        });

        activities.push({
          lead: lead._id,
          user: lead.assignedTo,
          type: 'status_change',
          title: 'Deal Lost',
          description: `Project dropped. Reason: Competitor price matching was tighter.`,
        });
      }

      // Save the updated statusHistory
      await lead.save();
    }

    await Activity.insertMany(activities);
    console.log(`${activities.length} activities/logs created.`);

    // 4. Seed Tasks / Followups
    const tasks = [];
    const activeLeads = createdLeads.filter(l => !['won', 'lost'].includes(l.status));
    
    for (let i = 0; i < activeLeads.length; i++) {
      const lead = activeLeads[i];
      const isDueToday = i % 3 === 0;
      const isOverdue = i % 3 === 1;
      
      let dueDate = new Date();
      if (isDueToday) {
        dueDate.setHours(12, 0, 0, 0); // Today noon
      } else if (isOverdue) {
        dueDate.setDate(dueDate.getDate() - 3); // 3 days ago
      } else {
        dueDate.setDate(dueDate.getDate() + 4); // 4 days from now
      }

      tasks.push({
        lead: lead._id,
        assignedTo: lead.assignedTo,
        assignedBy: manager._id,
        type: i % 2 === 0 ? 'follow_up' : 'call',
        title: i % 2 === 0 ? 'Send detailed steel alloy specs sheet' : 'Call client for feedback on proposal',
        description: `Seeded task for ${lead.companyName}. Crucial check-in.`,
        dueDate: dueDate,
        status: isOverdue ? 'pending' : 'pending', // overdue tasks are marked dynamically in code
        priority: lead.priority === 'critical' ? 'high' : lead.priority === 'high' ? 'high' : 'medium',
      });
    }

    await Task.insertMany(tasks);
    console.log(`${tasks.length} tasks/follow-ups created.`);

    // 5. Seed initial notifications
    const notifications = [
      {
        user: exec1._id,
        type: 'lead_assigned',
        title: 'New Lead Assigned',
        message: `Manager Sarah Smith assigned BriteTech Aerospace to you.`,
        isRead: false,
      },
      {
        user: exec2._id,
        type: 'follow_up_due',
        title: 'Task Due Today',
        message: `Task 'Call client for feedback on proposal' is due today.`,
        isRead: false,
      },
    ];
    await Notification.insertMany(notifications);

    console.log('Database successfully seeded!');
  } catch (error) {
    console.error(`Seeding error: ${error.message}`);
  }
};

export default seedData;
