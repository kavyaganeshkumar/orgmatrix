const Company = require('../models/Company');
const Project = require('../models/Project');
const User = require('../models/User');
const stripe = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null;

// 1. Get available plans
exports.getPlans = async (req, res) => {
    try {
        const plans = [
            { id: 'free', name: 'Free', price: 0, description: 'Basic features for small teams', limits: { projects: 2, users: 5 } },
            { id: 'pro', name: 'Pro', price: 49, description: 'Advanced tools for growing companies', limits: { projects: 10, users: 20 } },
            { id: 'enterprise', name: 'Enterprise', price: 199, description: 'Full power for large organizations', limits: { projects: 'Unlimited', users: 'Unlimited' } }
        ];
        res.status(200).json(plans);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 2. Create Stripe Subscription (Mock/Stub)
exports.createSubscription = async (req, res) => {
    const { planId, billingCycle } = req.body;
    try {
        const company = await Company.findOne({ tenantId: req.user.tenantId });
        if (!company) return res.status(404).json({ message: "Company not found" });

        // In a real app, you would create a Stripe Checkout Session here
        // For this demo, we'll just update the plan directly if it's "free" or if secret key is missing
        if (!process.env.STRIPE_SECRET_KEY) {
            company.plan = planId;
            company.billingCycle = billingCycle;
            company.subscriptionStatus = 'active';
            await company.save();
            return res.status(200).json({ message: `Successfully subscribed to ${planId} (Demo mode)`, company });
        }

        // Real Stripe Logic would go here...
        res.status(200).json({ message: "Stripe integration ready. Add STRIPE_SECRET_KEY to .env" });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 3. Handle Webhooks (Stripe)
exports.handleWebhook = async (req, res) => {
    // Logic to handle subscription renewals, cancellations, etc.
    res.status(200).send();
};

// 4. Update Theme Customization
exports.updateTheme = async (req, res) => {
    const { themeColor } = req.body;
    try {
        const company = await Company.findOneAndUpdate(
            { tenantId: req.user.tenantId },
            { themeColor },
            { new: true }
        );
        
        // Notify all clients in this tenant room about the theme change
        const io = req.app.get('io');
        io.to(req.user.tenantId).emit('theme-updated', themeColor);

        res.status(200).json({ message: "Theme updated successfully", themeColor });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 5. Get current usage vs limits
exports.getBillingUsage = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const company = await Company.findOne({ tenantId });
        if (!company) return res.status(404).json({ message: "Company not found" });

        const plans = {
            free: { projects: 2, users: 5 },
            pro: { projects: 10, users: 20 },
            enterprise: { projects: Infinity, users: Infinity }
        };

        const currentPlan = plans[company.plan || 'free'];
        const projectCount = await Project.countDocuments({ tenantId, isDeleted: false });
        const userCount = await User.countDocuments({ tenantId });

        res.status(200).json({
            plan: company.plan,
            status: company.subscriptionStatus,
            limits: currentPlan,
            usage: {
                projects: projectCount,
                users: userCount
            },
            percentage: {
                projects: currentPlan.projects === Infinity ? 0 : Math.round((projectCount / currentPlan.projects) * 100),
                users: currentPlan.users === Infinity ? 0 : Math.round((userCount / currentPlan.users) * 100)
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
