require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Company = require('../models/Company');

const connectDB = async () => {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/saas_app';
        await mongoose.connect(uri);
        console.log('MongoDB Connected');
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const updateUser = async () => {
    await connectDB();
    try {
        const googleCompany = await Company.findOne({ companyName: { $regex: new RegExp('^google$', 'i') } });
        if (!googleCompany) {
            console.log('Google company not found in DB');
            process.exit(1);
        }

        const user = await User.findOne({ email: 'syedmusthafa@gmail.com' });
        if (!user) {
            console.log('User syedmusthafa@gmail.com not found');
            process.exit(1);
        }

        user.companyName = googleCompany.companyName;
        user.tenantId = googleCompany.tenantId;
        await user.save();

        console.log('User updated successfully:', user);
    } catch (error) {
        console.error('Error updating user:', error);
    } finally {
        mongoose.connection.close();
    }
};

updateUser();
