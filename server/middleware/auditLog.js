import Activity from '../models/Activity.js';

export const auditLog = (actionType, descriptionBuilder) => {
  return async (req, res, next) => {
    // We capture the response finish event to ensure we only log successful actions
    res.on('finish', async () => {
      try {
        if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
          const leadId = req.params.id || req.body.leadId || req.body.lead;
          if (!leadId) return; // Skip audit log if no lead is linked

          const description = typeof descriptionBuilder === 'function' 
            ? descriptionBuilder(req) 
            : descriptionBuilder;

          await Activity.create({
            lead: leadId,
            user: req.user._id,
            type: actionType,
            title: `Audit: ${req.method} Action`,
            description: description || `${req.user.name} performed a ${req.method} request on lead.`,
          });
        }
      } catch (err) {
        console.error('Audit logger failed:', err);
      }
    });
    next();
  };
};
