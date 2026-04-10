const Company = require('../models/Company');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');

// @desc    Get analytics for dashboard
// @route   GET /api/analytics/stats
// @access  Private
exports.getDashboardStats = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        
        // 1. Get Company Details
        const company = await Company.findOne({ tenantId });
        
        // 2. Project stats
        const projects = await Project.find({ tenantId });
        const totalProjects = projects.length;
        
        // 3. Task / Completion rates
        const tasks = await Task.find({ tenantId });
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.status === 'completed' || t.status === 'done').length;
        const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
        
        // 4. Team stats
        const activeUsersCount = await User.countDocuments({ tenantId, status: 'active' });

        // 5. Monthly Revenue trends (Mocking based on company data since we don't have historical entries)
        // In a real app, this would query a 'Revenue' or 'Transaction' model
        const revenueTrends = [
            { month: 'Jan', revenue: (company.revenue * 0.7).toFixed(0) },
            { month: 'Feb', revenue: (company.revenue * 0.8).toFixed(0) },
            { month: 'Mar', revenue: (company.revenue * 0.9).toFixed(0) },
            { month: 'Apr', revenue: company.revenue }
        ];

        res.status(200).json({
            company: {
                name: company.companyName,
                revenue: company.revenue,
                profit: company.profit,
                employees: company.employees,
                plan: company.plan
            },
            stats: {
                totalProjects,
                totalTasks,
                completedTasks,
                completionRate: completionRate.toFixed(1),
                activeUsersCount
            },
            revenueTrends,
            projectDistribution: {
                active: projects.filter(p => p.status === 'active' || p.status === 'in-progress').length,
                completed: projects.filter(p => p.status === 'completed' || p.status === 'done').length,
                onHold: projects.filter(p => p.status === 'on-hold' || p.status === 'pending').length
            }
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
