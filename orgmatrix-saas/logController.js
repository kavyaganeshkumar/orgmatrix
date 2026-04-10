const ActivityLog = require('../models/ActivityLog');
const { Parser } = require('json2csv');

// @desc    Get filtered logs for tenant
// @route   GET /api/logs
const getLogs = async (req, res) => {
    try {
        const { userId, action, startDate, endDate, limit = 50 } = req.query;
        const query = req.user.role === 'super_admin' ? {} : { tenantId: req.user.tenantId };

        if (userId) query.userId = userId;
        if (action) query.action = new RegExp(action, 'i');
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const logs = await ActivityLog.find(query)
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .populate('userId', 'email')
            .lean();

        res.status(200).json(logs);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching logs', error: error.message });
    }
};

// @desc    Export logs as CSV
// @route   GET /api/logs/export
const exportLogs = async (req, res) => {
    try {
        const query = req.user.role === 'super_admin' ? {} : { tenantId: req.user.tenantId };
        const logs = await ActivityLog.find(query)
            .sort({ createdAt: -1 })
            .populate('userId', 'email')
            .lean();

        const fields = [
            { label: 'Date', value: 'createdAt' },
            { label: 'User', value: 'userId.email' },
            { label: 'Action', value: 'action' },
            { label: 'Resource Type', value: 'resourceType' },
            { label: 'Severity', value: 'severity' },
            { label: 'Details', value: (row) => JSON.stringify(row.details) }
        ];

        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(logs);

        res.header('Content-Type', 'text/csv');
        res.attachment(`audit_logs_${req.user.tenantId}_${new Date().toISOString()}.csv`);
        res.send(csv);
    } catch (error) {
        res.status(500).json({ message: 'Export failed', error: error.message });
    }
};

module.exports = { getLogs, exportLogs };
