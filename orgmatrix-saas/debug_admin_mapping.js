const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Company = require('../models/Company');
const Project = require('../models/Project');

dotenv.config();

async function debugMapping() {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/saas_app';
        await mongoose.connect(uri);
        console.log('Connected to DB:', uri);

        const users = await User.find().lean();
        const companies = await Company.find().lean();
        const projects = await Project.find().lean();

        console.log(`Found ${users.length} users total in system`);
        console.log(`Found ${companies.length} companies total in system`);
        console.log(`Found ${projects.length} projects total in system`);

        companies.forEach(c => {
            const companyTenantId = String(c.tenantId || '').trim();
            const matchingAdmins = users.filter(u => String(u.tenantId || '').trim() === companyTenantId && u.role === 'admin');
            const matchingUsers = users.filter(u => String(u.tenantId || '').trim() === companyTenantId);
            const matchingProjects = projects.filter(p => String(p.tenantId || '').trim() === companyTenantId);
            
            console.log(`\nCompany: ${c.companyName} (TenantID: ${c.tenantId})`);
            console.log(`   - Admins Found: ${matchingAdmins.length} (${matchingAdmins.map(a => a.email).join(', ')})`);
            console.log(`   - Total Users: ${matchingUsers.length}`);
            console.log(`   - Total Projects: ${matchingProjects.length}`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

debugMapping();
