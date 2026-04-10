const mongoose = require('mongoose');
const User = require('./models/User');
const Project = require('./models/Project');
const Task = require('./models/Task');
require('dotenv').config();

const seedTasks = async () => {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/saas_app';
        await mongoose.connect(uri);
        console.log('Connected to MongoDB for task seeding...');

        const companyIds = [1, 2, 3, 4];
        
        for (const i of companyIds) {
            const tenantId = `TNT-${['GOOGLE', 'MICROSOFT', 'ZOHO', 'ACCENTURE'][i-1]}`;
            console.log(`Seeding tasks for ${tenantId}...`);

            const projects = await Project.find({ tenantId });
            const dev = await User.findOne({ email: `company${i}Dev@gmail.com` });
            const tl = await User.findOne({ email: `company${i}TL@gmail.com` });
            const pm = await User.findOne({ email: `company${i}PM@gmail.com` });
            const admin = await User.findOne({ email: `companyadmin${i}@gmail.com` });

            if (!projects.length || !dev || !tl) {
                console.log(`Skipping ${tenantId} - missing users or projects`);
                continue;
            }

            for (const project of projects) {
                const tasks = [
                    {
                        title: `Finalize UI for ${project.name}`,
                        description: `Ensure the design system matches the new ${project.name} requirements.`,
                        status: 'completed',
                        priority: 'high',
                        assignedTo: dev._id,
                        assignedToName: dev.email
                    },
                    {
                        title: `API Integration - ${project.name}`,
                        description: `Connect the backend services for ${project.name} launch.`,
                        status: 'in-progress',
                        priority: 'high',
                        assignedTo: dev._id,
                        assignedToName: dev.email
                    },
                    {
                        title: `Code Review: ${project.name} Core`,
                        description: `Review the merge request for the core modules of ${project.name}.`,
                        status: 'pending',
                        priority: 'medium',
                        assignedTo: tl._id,
                        assignedToName: tl.email
                    },
                    {
                        title: `Unit Testing - ${project.name}`,
                        description: `Achieve 80% coverage for ${project.name} sprint 1.`,
                        status: 'pending',
                        priority: 'low',
                        assignedTo: dev._id,
                        assignedToName: dev.email
                    }
                ];

                for (const taskData of tasks) {
                    await Task.findOneAndUpdate(
                        { title: taskData.title, projectId: project._id },
                        {
                            ...taskData,
                            projectId: project._id,
                            projectName: project.name,
                            tenantId: tenantId,
                            createdBy: pm ? pm._id : admin._id,
                            deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                        },
                        { upsert: true, new: true }
                    );
                }
                console.log(`  - Seeded 4 tasks for project: ${project.name}`);
            }
        }

        console.log('✅ Tasks assigned to members across all companies!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Task seeding error:', error);
        process.exit(1);
    }
};

seedTasks();
