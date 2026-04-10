const User = require('../models/User');
const Company = require('../models/Company');
const logActivity = require('../utils/logger');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendEmail } = require('../utils/emailService');

const generateToken = (id, role, tenantId, email) => {
    return jwt.sign({ id, role, tenantId, email }, process.env.JWT_SECRET || 'secret', {
        expiresIn: '30d',
    });
};

// @desc    Register new user
// @route   POST /api/auth/register
const register = async (req, res) => {
    try {
        const { email, password, role, companyName } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Please add all fields' });
        }

        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const validRoles = ['admin', 'project_manager', 'team_lead', 'developer', 'viewer', 'hr_manager', 'support_analyst'];
        let defaultRole = validRoles.includes(role) ? role : 'developer';
        if (email.toLowerCase() === 'kavyaganeshkumar90@gmail.com') {
            defaultRole = 'super_admin';
        } else if (role === 'super_admin') {
            return res.status(403).json({ message: 'Restricted: Super Admin account creation is not allowed for this email.' });
        }

        // Synchronize Tenant ID by Company Name
        let tenantId = '';
        if (defaultRole === 'super_admin') {
            tenantId = 'master-platform';
        } else {
            // Normalize company name for case-insensitive lookup
            const orgName = (companyName || 'System').trim();
            const existingOrg = await Company.findOne({ 
                companyName: { $regex: new RegExp(`^${orgName}$`, 'i') } 
            });
            
            if (existingOrg) {
                tenantId = existingOrg.tenantId;
            } else {
                tenantId = `TNT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
                // Create company record for new owner
                if (defaultRole === 'admin') {
                    await Company.create({
                        companyName: orgName,
                        tenantId: tenantId,
                        email: email
                    });
                }
            }
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            email,
            password: hashedPassword,
            companyName: companyName || (defaultRole === 'super_admin' ? 'Master' : 'System'),
            role: defaultRole,
            tenantId
        });

        if (user) {
            await logActivity(req, {
                userId: user._id,
                tenantId: user.tenantId,
                action: 'User Self-Registration',
                severity: 'info',
                resourceId: user._id,
                resourceType: 'User',
                details: { email: user.email, role: user.role }
            });

            // 📧 Send Welcome Email
            try {
                await sendEmail(
                    user.email,
                    'Welcome to OrgMatrix SaaS!',
                    `Hi there! Welcome to OrgMatrix. Your account as ${user.role} has been created.`,
                    `<h1>Welcome to OrgMatrix!</h1><p>Hi there! Your account in <b>${user.companyName}</b> as a <b>${user.role}</b> has been successfully created.</p>`
                );
            } catch (err) { console.warn('[EMAIL_QUEUE_WARN]: Registration email failed'); }

            res.status(201).json({
                _id: user.id,
                email: user.email,
                companyName: user.companyName,
                role: user.role,
                tenantId: user.tenantId,
                token: generateToken(user._id, user.role, user.tenantId, user.email)
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });

        if (user && (await bcrypt.compare(password, user.password))) {
            // Master Super Admin Restriction
            if (user.role === 'super_admin' && user.email.toLowerCase() !== 'kavyaganeshkumar90@gmail.com') {
                return res.status(403).json({ message: 'Error: This account does not have Super Admin privileges.' });
            }
            await logActivity(req, {
                userId: user.id,
                tenantId: user.tenantId,
                action: 'System Authentication',
                severity: 'info',
                details: { email: user.email, role: user.role }
            });

            res.json({
                _id: user.id,
                email: user.email,
                companyName: user.companyName,
                role: user.role,
                tenantId: user.tenantId,
                addedByTeamLead: user.addedByTeamLead,
                token: generateToken(user._id, user.role, user.tenantId, user.email)
            });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

// @desc    Update user profile
// @route   PUT /api/auth/profile
const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (user) {
            user.email = req.body.email || user.email;
            user.companyName = req.body.companyName || user.companyName;

            if (req.body.password) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(req.body.password, salt);
            }

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                email: updatedUser.email,
                companyName: updatedUser.companyName,
                role: updatedUser.role,
                tenantId: updatedUser.tenantId,
                token: generateToken(updatedUser._id, updatedUser.role, updatedUser.tenantId, updatedUser.email)
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get all users for a tenant
// @route   GET /api/auth/users
const getTenantUsers = async (req, res) => {
    try {
        const query = req.user.role === 'super_admin' ? {} : { tenantId: req.user.tenantId };
        const users = await User.find(query, '-password');
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Add a team member to a tenant's organization
// @route   POST /api/auth/add-member
const addTeamMember = async (req, res) => {
    try {
        const callerRole = req.user.role;
        const allowedCallers = ['project_manager', 'team_lead'];
        if (!allowedCallers.includes(callerRole)) {
            return res.status(403).json({ message: 'Only Project Managers and Team Leads can add new members.' });
        }

        const { email, password, role } = req.body;
        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: 'User already exists' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const mainCompany = await Company.findOne({ tenantId: req.user.tenantId });
        const orgName = mainCompany ? mainCompany.companyName : (req.user.companyName || 'Team Member');

        const allRoles = ['project_manager', 'team_lead', 'developer', 'viewer', 'hr_manager', 'support_analyst'];

        const assignedRole = allRoles.includes(role) ? role : 'developer';

        const user = await User.create({
            email,
            password: hashedPassword,
            role: assignedRole,
            tenantId: req.user.tenantId,
            companyName: orgName,
            addedByTeamLead: true
        });

        // 📧 Notify New Team Member
        try {
            await sendEmail(
                user.email,
                'You have been added to a team!',
                `Hi! You have been added to ${orgName} on OrgMatrix as a ${user.role}. Password: ${password}`,
                `<h2>Welcome to ${orgName}!</h2><p>You have been added as a <b>${user.role}</b>.</p><p>Login with your email and this temporary password: <code>${password}</code></p>`
            );
        } catch (err) { console.warn('[EMAIL_QUEUE_WARN]: Member addition email failed'); }

        res.status(201).json({ email: user.email, role: user.role });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    register,
    login,
    updateProfile,
    getTenantUsers,
    addTeamMember
};
