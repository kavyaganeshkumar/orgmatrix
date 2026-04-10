const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const seedAdmin = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect('mongodb://127.0.0.1:27017/saas_app');
        
        // Remove any other super_admin accounts to enforce single authorized access
        await User.deleteMany({ role: 'super_admin', email: { $ne: 'kavyaganeshkumar90@gmail.com' } });
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('19012007', salt);
        
        // Ensure kavyaganeshkumar90@gmail.com is the only super_admin
        await User.findOneAndUpdate(
            { email: 'kavyaganeshkumar90@gmail.com' },
            {
                email: 'kavyaganeshkumar90@gmail.com',
                password: hashedPassword,
                role: 'super_admin',
                tenantId: 'master-platform',
                companyName: 'OrgMatrix HQ'
            },
            { upsert: true, new: true }
        );
        
        console.log('✅ Admin credentials updated successfully!');
        console.log('👉 Email: kavyaganeshkumar90@gmail.com');
        console.log('👉 Password: 19012007');
        
        process.exit(0);
    } catch (error) {
        console.error('Error seeding admin user:', error);
        process.exit(1);
    }
};

seedAdmin();
