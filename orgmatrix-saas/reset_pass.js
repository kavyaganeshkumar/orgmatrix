const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const resetPassword = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/saas_app');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('19012007', salt);

        await User.findOneAndUpdate(
            { email: 'kavyaganeshkumar90@gmail.com' },
            { password: hashedPassword, role: 'super_admin', tenantId: 'master-platform' }
        );
        console.log('✅ Password reset to 19012007 for kavyaganeshkumar90@gmail.com');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

resetPassword();
