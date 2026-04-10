const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Company = require('./models/Company');
const Project = require('./models/Project');
require('dotenv').config();

const seedUsersAndProjects = async () => {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/saas_app';
        await mongoose.connect(uri);
        console.log('Connected to MongoDB...');

        const getHashedPassword = async (plainText) => {
            const salt = await bcrypt.genSalt(10);
            return await bcrypt.hash(plainText, salt);
        };

        const companies = [
            { name: 'Google LLC', tenantId: 'TNT-GOOGLE', projects: ['Gemini 2.0 Integration', 'Workspace Hub Revamp'] },
            { name: 'Microsoft Corporation', tenantId: 'TNT-MICROSOFT', projects: ['Azure Quantum Alpha', 'Copilot Office Suite'] },
            { name: 'Zoho Corporation Pvt. Ltd.', tenantId: 'TNT-ZOHO', projects: ['Zoho CRM Mobile', 'Inventory Pro X'] },
            { name: 'Accenture plc', tenantId: 'TNT-ACCENTURE', projects: ['Enterprise AI Migration', 'Global Cloud Strategy'] }
        ];

        const roles = [
            { role: 'project_manager', suffix: 'PM' },
            { role: 'team_lead', suffix: 'TL' },
            { role: 'developer', suffix: 'Dev' },
            { role: 'viewer', suffix: 'Viewer' },
            { role: 'support_analyst', suffix: 'Support' }
        ];

        for (let i = 0; i < companies.length; i++) {
            const company = companies[i];
            const companyIndex = i + 1;

            console.log(`Processing ${company.name}...`);

            // 1. Create Users for all roles
            const companyUsers = {};
            for (const roleInfo of roles) {
                const email = `company${companyIndex}${roleInfo.suffix}@gmail.com`;
                const pass = `company${companyIndex}${roleInfo.suffix}`;
                const hashedPassword = await getHashedPassword(pass);

                const user = await User.findOneAndUpdate(
                    { email: email },
                    {
                        email: email,
                        password: hashedPassword,
                        companyName: company.name,
                        role: roleInfo.role,
                        tenantId: company.tenantId
                    },
                    { upsert: true, new: true }
                );
                companyUsers[roleInfo.role] = user;
                console.log(`  - Created ${roleInfo.role}: ${email}`);
            }

            // Get the Admin user for this company (created in previous step)
            const adminUser = await User.findOne({ email: `companyadmin${companyIndex}@gmail.com` });

            // 2. Create Projects
            for (let j = 0; j < company.projects.length; j++) {
                const projectName = company.projects[j];
                const budget = Math.floor(Math.random() * 500000) + 100000;
                const deadline = new Date();
                deadline.setMonth(deadline.getMonth() + 6);

                await Project.findOneAndUpdate(
                    { name: projectName, tenantId: company.tenantId },
                    {
                        name: projectName,
                        description: `Official project for ${company.name}: ${projectName}`,
                        status: 'active',
                        budget: budget,
                        deadline: deadline,
                        tenantId: company.tenantId,
                        owner: adminUser ? adminUser._id : companyUsers['project_manager']._id,
                        handlerName: companyUsers['project_manager'] ? companyUsers['project_manager'].email : 'Unassigned'
                    },
                    { upsert: true, new: true }
                );
                console.log(`  - Created Project: ${projectName}`);
            }
        }

        console.log('✅ All users and projects have been seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding error:', error);
        process.exit(1);
    }
};

seedUsersAndProjects();
