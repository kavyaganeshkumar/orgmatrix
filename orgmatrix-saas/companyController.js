const Company = require('../models/Company');
const logActivity = require('../utils/logger');

// @desc    Get companies for the logged-in user's tenant
// @route   GET /api/company
const getCompany = async (req, res) => {
    try {
        const isAdmin = ['admin', 'super_admin', 'hr_manager'].includes(req.user.role);
        const projection = isAdmin ? {} : { revenue: 0, expenses: 0, profit: 0, taxId: 0 };
        
        const query = req.user.role === 'super_admin' ? {} : { tenantId: req.user.tenantId };
        const companies = await Company.find(query, projection).sort({ createdAt: -1 });
        res.status(200).json(companies);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Create a new company record
// @route   POST /api/company
const createCompany = async (req, res) => {
    try {
        const allowedRoles = ['admin', 'super_admin', 'hr_manager'];
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Authorization Required: Only Admins and HR Managers can store company details.' });
        }

        if (!req.body.companyName) {
            return res.status(400).json({ message: 'Please add a companyName field' });
        }

        let logoUrl = '';
        if (req.file) {
            logoUrl = `/uploads/${req.file.filename}`;
        }

        const { revenue, expenses } = req.body;
        const profit = (Number(revenue) || 0) - (Number(expenses) || 0);

        const company = await Company.create({
            ...req.body,
            profit,
            logoUrl,
            tenantId: req.user.tenantId,
            createdBy: req.user.id
        });

        // 🎨 Emit Theme Update if provided
        if (req.body.themeColor) {
            const io = req.app.get('io');
            io.to(req.user.tenantId).emit('theme-updated', req.body.themeColor);
        }

        await logActivity(req, {
            action: 'Stored Company Record',
            severity: 'info',
            resourceId: company._id,
            resourceType: 'Company',
            details: { companyName: company.companyName, year: company.year }
        });

        res.status(201).json(company);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update company record
// @route   PUT /api/company/:id
const updateCompany = async (req, res) => {
    try {
        const allowedRoles = ['admin', 'super_admin', 'hr_manager'];
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Authorization Required: Only Admins and HR Managers can update company details.' });
        }

        const company = await Company.findById(req.params.id);

        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }

        // Make sure the logged in user matches the company's tenant, unless they are admin/super_admin
        if (company.tenantId !== req.user.tenantId && !['admin', 'super_admin'].includes(req.user.role)) {
            return res.status(401).json({ message: 'User not authorized' });
        }

        const updatedCompany = await Company.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        await logActivity(req, {
            action: 'Updated Company Details',
            severity: 'warning',
            resourceId: req.params.id,
            resourceType: 'Company',
            details: { updates: req.body }
        });

        res.status(200).json(updatedCompany);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Delete company record
// @route   DELETE /api/company/:id
const deleteCompany = async (req, res) => {
    try {
        const allowedRoles = ['admin', 'super_admin', 'hr_manager'];
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Only Admins and HR Managers can perform this action.' });
        }

        const company = await Company.findById(req.params.id);

        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }

        // Make sure the logged in user matches the company's tenant, unless they are admin/super_admin
        if (company.tenantId !== req.user.tenantId && !['admin', 'super_admin'].includes(req.user.role)) {
            return res.status(401).json({ message: 'User not authorized' });
        }

        await company.deleteOne();

        await logActivity(req, {
            action: 'Deleted Company Details',
            severity: 'danger',
            resourceId: req.params.id,
            resourceType: 'Company'
        });

        res.status(200).json({ id: req.params.id });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    getCompany,
    createCompany,
    updateCompany,
    deleteCompany,
};
