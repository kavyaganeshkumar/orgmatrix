const Service = require('../models/Service');
const logActivity = require('../utils/logger');

exports.getServices = async (req, res) => {
  try {
    const filter = req.user.role === 'super_admin' ? {} : { tenantId: req.user.tenantId };
    if (req.query.projectId) filter.projectId = req.query.projectId;
    if (req.query.status && req.query.status !== 'All') filter.status = req.query.status;

    const services = await Service.find(filter);
    res.json(services);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createService = async (req, res) => {
  try {
    const service = new Service({
      ...req.body,
      tenantId: req.user.tenantId,
      owner: req.user.id
    });
    const newService = await service.save();
    
    // Log service creation for admin
    await logActivity(req, {
      action: 'Created Service',
      severity: 'info',
      resourceId: newService._id,
      resourceType: 'Service',
      details: { serviceName: newService.name, type: newService.type }
    });

    res.status(201).json(newService);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

