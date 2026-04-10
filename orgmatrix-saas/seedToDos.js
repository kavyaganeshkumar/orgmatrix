const mongoose = require('mongoose');
const User = require('./models/User');
const Project = require('./models/Project');
const Task = require('./models/Task');
require('dotenv').config();

const seedToDos = async () => {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/saas_app';
        await mongoose.connect(uri);
        console.log('Connected to MongoDB for To-Do seeding...');

        const companyIds = [1, 2, 3, 4];
        const companies = ['GOOGLE', 'MICROSOFT', 'ZOHO', 'ACCENTURE'];

        for (const i of companyIds) {
            const tenantId = `TNT-${companies[i-1]}`;
            const users = await User.find({ tenantId });
            const projects = await Project.find({ tenantId });

            if (!projects.length) continue;
            const project = projects[0]; // Assign to first project

            for (const user of users) {
                const roleName = user.role.replace('_', ' ').toUpperCase();
                const todos = [
                    {
                        title: `[${roleName}] Weekly Status Report`,
                        description: `Submit your weekly progress and blockers for the ${project.name} project.`,
                        status: 'pending',
                        priority: 'medium',
                        assignedTo: user._id,
                        assignedToName: user.email,
                        deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days from now
                    },
                    {
                        title: `[${roleName}] Internal Sync Meeting`,
                        description: `Attend the department sync to discuss the upcoming milestones.`,
                        status: 'pending',
                        priority: 'high',
                        assignedTo: user._id,
                        assignedToName: user.email,
                        deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000) // 1 day from now
                    }
                ];

                for (const todo of todos) {
                    await Task.findOneAndUpdate(
                        { title: todo.title, assignedTo: user._id },
                        {
                            ...todo,
                            projectId: project._id,
                            projectName: project.name,
                            tenantId: tenantId,
                            createdBy: users.find(u => u.role === 'admin' || u.role === 'super_admin')._id
                        },
                        { upsert: true, new: true }
                    );
                }
            }
            console.log(`✅ Seeded 2 To-Do jobs for all 7 members in ${tenantId}`);
        }

        console.log('🎉 All team members in all tenants now have active tasks and deadlines!');
        process.exit(0);
    } catch (error) {
        console.error('❌ To-Do seeding error:', error);
        process.exit(1);
    }
};

seedToDos();
