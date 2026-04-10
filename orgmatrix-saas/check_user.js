const mongoose = require('mongoose');
const User = require('./models/User');

const checkUser = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/saas_app');
        const user = await User.findOne({ email: 'kavyaganeshkumar90@gmail.com' });
        if (user) {
            console.log('User found:', {
                email: user.email,
                role: user.role,
                tenantId: user.tenantId,
                hasPassword: !!user.password
            });
        } else {
            console.log('User not found.');
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkUser();
