const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Company = require('../models/Company');
const Project = require('../models/Project');
const Service = require('../models/Service');

const seedData = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect('mongodb://127.0.0.1:27017/saas_app');
        
        // Clear old data
        await User.deleteMany({});
        await Company.deleteMany({});
        await Project.deleteMany({});
        await Service.deleteMany({});
        
        // 1. Create a Company (Tenant)
        const company = await Company.create({
            companyName: 'Docs Samples',
            industry: 'Technology',
            revenue: 500000,
            expenses: 200000,
            profit: 300000,
            employees: '25',
            year: 2024,
            region: 'Oregon',
            tenantId: 'TNT-1001'
        });
        
        // 2. Create a User for this company
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);
        
        const user = await User.create({
            email: 'user@docs.com',
            password: hashedPassword,
            role: 'user',
            tenantId: company._id,
            companyName: company.companyName
        });
        
        // 3. Create Projects
        const projectMain = await Project.create({
            name: 'Main Platform',
            tenantId: company._id,
            owner: user._id
        });
        
        const projectExp = await Project.create({
            name: 'Experimental',
            tenantId: company._id,
            owner: user._id
        });
        
        // 4. Create Services (matching your image)
        await Service.create([
            {
                name: 'site-frontend',
                status: 'Deployed',
                type: 'Web Service',
                runtime: 'Node',
                region: 'Oregon',
                deployedAt: new Date(Date.now() - 1000*60*60*24*240), // 8mo ago
                projectId: projectMain._id,
                tenantId: company._id,
                owner: user._id
            },
            {
                name: 'site-backend',
                status: 'Deployed',
                type: 'Web Service',
                runtime: 'Node',
                region: 'Oregon',
                deployedAt: new Date(Date.now() - 1000*60*60*24*365), // 1y ago
                projectId: projectMain._id,
                tenantId: company._id,
                owner: user._id
            },
            {
                name: 'my-db',
                status: 'Available',
                type: 'PostgreSQL',
                runtime: 'PostgreSQL 16',
                region: 'Ohio',
                deployedAt: new Date(Date.now() - 1000*60*60), // <1m ago
                tenantId: company._id,
                owner: user._id
            },
            {
                name: 'my-cron-job',
                status: 'Successful run',
                type: 'Cron Job',
                runtime: 'Node',
                region: 'Oregon',
                deployedAt: new Date(Date.now() - 1000*60*60*24*330), // 11mo ago
                tenantId: company._id,
                owner: user._id
            }
        ]);
        
        console.log('✅ Seed data successful!');
        console.log('Login with:');
        console.log('Email: user@docs.com');
        console.log('Password: password123');
        
        process.exit(0);
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedData();
