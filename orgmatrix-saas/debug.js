require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Company = require('../models/Company');

const test = async () => {
    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/saas_app';
    await mongoose.connect(uri);
    try {
        const companies = await Company.find({}, 'companyName tenantId');
        console.log('Companies:', companies);

        const user = await User.findOne({ email: 'syedmusthafa@gmail.com' });
        console.log('User:', user);
    } catch (e) {
        console.error(e);
    } finally {
         mongoose.connection.close();
    }
};

test();
