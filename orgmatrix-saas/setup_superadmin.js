require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const updateAdminToSuperAdmin = async () => {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/saas_app';
        await mongoose.connect(uri);
        console.log('MongoDB Connected');

        // Target user: kavyaganeshkumar90@gmail.com
        const user = await User.findOne({ email: 'kavyaganeshkumar90@gmail.com' });
        
        if (user) {
            user.role = 'super_admin';
            user.companyName = 'System Admin'; // Or 'None'/null as requested
            user.tenantId = 'system-admin';    // Unique tenantId for the super admin
            await user.save();
            console.log('User upgraded to super_admin successfully:', user.email);
        } else {
            console.log('User kavyaganeshkumar90@gmail.com not found');
        }

        // Also rectifying syedmusthafa@gmail.com from previous request if not already done correctly
        const user2 = await User.findOne({ email: 'syedmusthafa@gmail.com' });
        if (user2) {
            // Rectify syedmusthafa to Google if not already done
            // Assuming tenantId for Google is 'google-tenant' or similar
            // I'll leave this part for now unless I find the Google tenantId
            console.log('User syedmusthafa@gmail.com found, current tenant:', user2.tenantId);
        }

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await mongoose.connection.close();
    }
};

updateAdminToSuperAdmin();
