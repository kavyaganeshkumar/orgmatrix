const ActivityLog = require('../models/ActivityLog');

/**
 * Advanced Activity Logger for Multi-Tenant SaaS
 * @param {Object} req - Express request object (optional)
 * @param {Object} data - Log data { userId, tenantId, action, severity, resourceId, resourceType, details }
 */
const logActivity = async (req, data) => {
    try {
        const { userId, tenantId, action, severity, resourceId, resourceType, details } = data;
        
        const logData = {
            userId: userId || req?.user?.id || null,
            userRole: req?.user?.role || 'Guest',
            tenantId: tenantId || req?.user?.tenantId || 'System',
            action,
            severity: severity || 'info',
            resourceId,
            resourceType,
            details,
            ipAddress: req?.ip || req?.headers['x-forwarded-for'] || req?.connection?.remoteAddress,
            userAgent: req?.headers['user-agent']
        };

        // Deep clean undefined fields
        Object.keys(logData).forEach(key => logData[key] === undefined && delete logData[key]);

        await ActivityLog.create(logData);
    } catch (error) {
        console.error('[LOGGER_ERROR]: Failed to persist activity log:', error);
    }
};

module.exports = logActivity;
