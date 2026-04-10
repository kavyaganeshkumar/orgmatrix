const Company = require('../models/Company');
const Project = require('../models/Project');
const User = require('../models/User');

const checkLimit = (resourceType) => {
    return async (req, res, next) => {
        try {
            const tenantId = req.user.tenantId;
            const company = await Company.findOne({ tenantId });

            if (!company) {
                return res.status(404).json({ message: "Company not found" });
            }

            const limits = {
                free: { projects: 2, users: 5 },
                pro: { projects: 10, users: 20 },
                enterprise: { projects: Infinity, users: Infinity }
            };

            const plan = company.plan || 'free';
            const currentLimits = limits[plan];

            if (resourceType === 'projects') {
                const count = await Project.countDocuments({ tenantId });
                if (count >= currentLimits.projects) {
                    return res.status(403).json({ 
                        message: `Project limit reached for your ${plan} plan. Upgrade to increase limits.`,
                        limit: currentLimits.projects,
                        current: count
                    });
                }
            }

            if (resourceType === 'users') {
                const count = await User.countDocuments({ tenantId });
                if (count >= currentLimits.users) {
                    return res.status(403).json({ 
                        message: `User limit reached for your ${plan} plan. Upgrade to increase limits.`,
                        limit: currentLimits.users,
                        current: count
                    });
                }
            }

            next();
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    };
};

module.exports = checkLimit;
