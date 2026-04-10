const mongoose = require('mongoose');
const User = require('../models/User');
const Company = require('../models/Company');
require('dotenv').config();

const verifyData = async () => {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/saas_app';
        await mongoose.connect(uri);
        console.log('--- Verifying Data Integrity ---');

        const companyCount = await Company.countDocuments();
        const userCount = await User.countDocuments();

        console.log(`Total Companies: ${companyCount}`);
        console.log(`Total Users: ${userCount}`);

        const companies = await Company.find({}, 'companyName tenantId');
        console.log('Companies present:');
        companies.forEach(c => console.log(` - ${c.companyName} (${c.tenantId})`));

        const admins = await User.find({ role: 'admin' }, 'email companyName');
        console.log('Admins present:');
        admins.forEach(a => console.log(` - ${a.email} (${a.companyName})`));

        await mongoose.disconnect();
        console.log('--- Verification Complete ---');
    } catch (error) {
        console.error('Verification failed:', error);
    }
};

verifyData();
