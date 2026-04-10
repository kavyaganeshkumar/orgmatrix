const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const testLogin = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/saas_app');
        const email = 'kavyaganeshkumar90@gmail.com';
        const rawPassword = '19012007';

        const user = await User.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
        if (!user) {
            console.log('Test Failed: User not found in DB');
            process.exit(1);
        }

        const isMatch = await bcrypt.compare(rawPassword, user.password);
        if (isMatch) {
            console.log('Test Success: Password matches hash for', user.email);
            console.log('User Role:', user.role);
            console.log('User TenantId:', user.tenantId);
        } else {
            console.log('Test Failed: Password does NOT match hash');
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

testLogin();
