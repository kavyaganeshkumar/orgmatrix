const Project = require('../models/Project');
const Service = require('../models/Service');
const Company = require('../models/Company');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

// @desc    Get all companies (Admin only)
// @route   GET /api/admin/companies
const getAllCompanies = async (req, res) => {
    try {
        const companies = await Company.find().populate('createdBy', 'email');
        res.status(200).json(companies);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get all users (Admin only)
// @route   GET /api/admin/users
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}, '-password');
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get admin statistics and all data summary
// @route   GET /api/admin/dashboard-data
const getDashboardData = async (req, res) => {
    try {
        const companies = await Company.find().populate('createdBy', 'email').lean();
        const users = await User.find({}, '-password').lean();
        const projects = await Project.find({ isDeleted: { $ne: true } }).populate('owner', 'email').lean();
        const services = await Service.find().lean();
        const recentActivities = await ActivityLog.find()
            .sort({ createdAt: -1 })
            .limit(20)
            .populate('userId', 'email')
            .lean();

        // 🏢 Map Admins to Companies
        const enhancedCompanies = companies.map((company) => {
            const companyAdmins = users.filter(u => 
                String(u.tenantId || '').trim() === String(company.tenantId || '').trim() && 
                u.role === 'admin'
            );
            const totalProjectCount = projects.filter(p => 
                String(p.tenantId || '').trim() === String(company.tenantId || '').trim()
            ).length;
            const totalUserCount = users.filter(u => 
                String(u.tenantId || '').trim() === String(company.tenantId || '').trim()
            ).length;

            return {
                ...company,
                admins: companyAdmins.map(a => ({ email: a.email, lastActive: a.lastActive })),
                usage: {
                    projects: totalProjectCount,
                    users: totalUserCount
                }
            };
        });

        res.status(200).json({
            companies: enhancedCompanies,
            users,
            projects,
            services,
            recentActivities,
            stats: {
                totalCompanies: companies.length,
                totalUsers: users.length,
                totalProjects: projects.length,
                totalServices: services.length,
                activeSubscriptions: companies.filter(c => c.subscriptionStatus === 'active').length,
                totalRevenue: companies.reduce((acc, curr) => acc + (Number(curr.revenue) || 0), 0)
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get admin statistics
// @route   GET /api/admin/stats
const getStats = async (req, res) => {
    try {
        const totalTenants = await Company.countDocuments();
        const totalUsers = await User.countDocuments();
        const recentActivities = await ActivityLog.find().sort({ createdAt: -1 }).limit(10).populate('userId', 'email');

        res.status(200).json({
            totalTenants,
            totalUsers,
            recentActivities
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update user role (Admin only)
// @route   PATCH /api/admin/users/:id/role
const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        const validRoles = ['project_manager', 'team_lead', 'developer', 'viewer', 'hr_manager', 'support_analyst'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ message: 'Invalid role specified' });
        }
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role },
            { new: true, select: '-password' }
        );
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.status(200).json({ message: 'Role updated', user });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    getAllCompanies,
    getAllUsers,
    getDashboardData,
    getStats,
    updateUserRole
};
