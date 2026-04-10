const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const resetPassword = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/saas_app');
        const salt = await bcrypt.genSalt(10);
        const password = 'kavya1901';
        const hashedPassword = await bcrypt.hash(password, salt);

        await User.findOneAndUpdate(
            { email: { $regex: new RegExp(`^kavyaganeshkumar90@gmail.com$`, 'i') } },
            { 
                password: hashedPassword, 
                role: 'super_admin', 
                tenantId: 'master-platform',
                companyName: 'OrgMatrix HQ'
            },
            { upsert: true }
        );
        console.log(`✅ Password reset to ${password} for kavyaganeshkumar90@gmail.com`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

resetPassword();
