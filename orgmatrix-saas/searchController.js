const Project = require('../models/Project');
const Task = require('../models/Task');
const Service = require('../models/Service');
const User = require('../models/User');

// @desc    Global Multi-Tenant Search
// @route   GET /api/search
const globalSearch = async (req, res) => {
    try {
        const { query, type, role, status } = req.query;
        const { tenantId } = req.user;

        if (!query || query.length < 2) {
            return res.status(400).json({ message: 'Search query must be at least 2 characters' });
        }

        const searchRegex = new RegExp(query, 'i');
        const results = {
            projects: [],
            tasks: [],
            services: [],
            users: []
        };

        const baseQuery = { tenantId, isDeleted: { $ne: true } };

        // 1. Search Projects
        if (!type || type === 'projects') {
            const pQuery = { ...baseQuery, name: searchRegex };
            if (status) pQuery.status = status;
            results.projects = await Project.find(pQuery).limit(10);
        }

        // 2. Search Tasks
        if (!type || type === 'tasks') {
            const tQuery = { ...baseQuery, title: searchRegex };
            if (status) tQuery.status = status;
            results.tasks = await Task.find(tQuery).limit(10);
        }

        // 3. Search Services
        if (!type || type === 'services') {
            results.services = await Service.find({ ...baseQuery, name: searchRegex }).limit(10);
        }

        // 4. Search Users
        if (!type || type === 'users') {
            const uQuery = { tenantId, email: searchRegex };
            if (role) uQuery.role = role;
            results.users = await User.find(uQuery).select('-password').limit(10);
        }

        res.status(200).json(results);
    } catch (err) {
        res.status(500).json({ message: 'Search failed', error: err.message });
    }
};

module.exports = { globalSearch };
