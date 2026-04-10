const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Company = require('./models/Company');
require('dotenv').config();

const seedNewCompanies = async () => {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/saas_app';
        await mongoose.connect(uri);
        console.log('Connected to MongoDB...');

        // We will generate passwords based on the company index/name as requested
        const getHashedPassword = async (plainText) => {
            const salt = await bcrypt.genSalt(10);
            return await bcrypt.hash(plainText, salt);
        };

        const companiesData = [
            {
                name: 'Google LLC',
                industry: 'Technology',
                region: 'Global',
                revenue: 307000000000,
                expenses: 215000000000,
                profit: 73000000000,
                employees: 182000,
                year: '2023',
                email: 'press@google.com',
                phone: '16502530000',
                website: 'https://www.google.com',
                taxId: 'N/A',
                address: '1600 Amphitheatre Parkway, Mountain View, CA, USA',
                description: 'Global leader in search, ads, cloud, and AI.',
                tenantId: 'TNT-GOOGLE',
                adminEmail: 'companyadmin1@gmail.com',
                hrEmail: 'company1HR@gmail.com'
            },
            {
                name: 'Microsoft Corporation',
                industry: 'Technology',
                region: 'Global',
                revenue: 211900000000,
                expenses: 148500000000,
                profit: 72360000000,
                employees: 221000,
                year: '2023',
                email: 'msft@microsoft.com',
                phone: '14258808080',
                website: 'https://www.microsoft.com',
                taxId: '911144442',
                address: 'One Microsoft Way, Redmond, WA, USA',
                description: 'Software, cloud computing, and enterprise solutions leader.',
                tenantId: 'TNT-MICROSOFT',
                adminEmail: 'companyadmin2@gmail.com',
                hrEmail: 'company2HR@gmail.com'
            },
            {
                name: 'Zoho Corporation Pvt. Ltd.',
                industry: 'Software / SaaS',
                region: 'Global (India-based)',
                revenue: 1000000000,
                expenses: 700000000,
                profit: 300000000,
                employees: 15000,
                year: '2023',
                email: 'info@zoho.com',
                phone: '914422567000',
                website: 'https://www.zoho.com',
                taxId: 'N/A',
                address: 'Estancia IT Park, Chennai, Tamil Nadu, India',
                description: 'SaaS company offering business apps like CRM, Books, and Mail.',
                tenantId: 'TNT-ZOHO',
                adminEmail: 'companyadmin3@gmail.com',
                hrEmail: 'company3HR@gmail.com'
            },
            {
                name: 'Accenture plc',
                industry: 'Consulting / IT Services',
                region: 'Global',
                revenue: 64100000000,
                expenses: 52600000000,
                profit: 6900000000,
                employees: 743000,
                year: '2023',
                email: 'info@accenture.com',
                phone: '12126128000',
                website: 'https://www.accenture.com',
                taxId: '980621686',
                address: 'Dublin, Ireland',
                description: 'Global professional services company specializing in consulting, technology, and outsourcing.',
                tenantId: 'TNT-ACCENTURE',
                adminEmail: 'companyadmin4@gmail.com',
                hrEmail: 'company4HR@gmail.com'
            }
        ];

        for (let i = 0; i < companiesData.length; i++) {
            const data = companiesData[i];
            const adminPass = `companyadmin${i + 1}`;
            const hashedAdminPass = await getHashedPassword(adminPass);
            const hrPass = `company${i + 1}HR`; 
            const hashedHRPass = await getHashedPassword(hrPass);

            // Create Admin
            const admin = await User.findOneAndUpdate(
                { email: data.adminEmail },
                {
                    email: data.adminEmail,
                    password: hashedAdminPass,
                    companyName: data.name,
                    role: 'admin',
                    tenantId: data.tenantId
                },
                { upsert: true, new: true }
            );

            // Create HR
            await User.findOneAndUpdate(
                { email: data.hrEmail },
                {
                    email: data.hrEmail,
                    password: hashedHRPass,
                    companyName: data.name,
                    role: 'hr_manager',
                    tenantId: data.tenantId
                },
                { upsert: true, new: true }
            );

            // Create Company
            await Company.findOneAndUpdate(
                { tenantId: data.tenantId },
                {
                    companyName: data.name,
                    tenantId: data.tenantId,
                    createdBy: admin._id,
                    industry: data.industry,
                    revenue: data.revenue,
                    expenses: data.expenses,
                    profit: data.profit,
                    employees: data.employees,
                    year: data.year,
                    region: data.region,
                    email: data.email,
                    phone: data.phone,
                    website: data.website,
                    address: data.address,
                    description: data.description,
                    taxId: data.taxId,
                    status: 'active'
                },
                { upsert: true, new: true }
            );
        }

        console.log('✅ 4 Companies and their Admin/HR users have been seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding error:', error);
        process.exit(1);
    }
};

seedNewCompanies();
