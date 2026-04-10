const ProjectTemplate = require('../models/ProjectTemplate');
const Project = require('../models/Project');
const Task = require('../models/Task');
const logActivity = require('../utils/logger');

const getTemplates = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const templates = await ProjectTemplate.find({ 
            $or: [{ tenantId }, { isGlobal: true }] 
        });
        res.status(200).json(templates);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching templates', error: err.message });
    }
};

const createTemplate = async (req, res) => {
    try {
        const { tenantId, role } = req.user;
        const { name, description, tasks, isGlobal } = req.body;

        if (isGlobal && role !== 'super_admin') {
            return res.status(403).json({ message: 'Only super admins can create global templates' });
        }

        const template = await ProjectTemplate.create({
            name,
            description,
            tasks,
            isGlobal: isGlobal || false,
            tenantId
        });

        res.status(201).json(template);
    } catch (err) {
        res.status(400).json({ message: 'Failed to create template', error: err.message });
    }
};

const applyTemplate = async (req, res) => {
    try {
        const { tenantId, id: userId } = req.user;
        const { templateId, projectId } = req.body;

        const template = await ProjectTemplate.findById(templateId);
        if (!template) return res.status(404).json({ message: 'Template not found' });

        const project = await Project.findOne({ _id: projectId, tenantId });
        if (!project) return res.status(404).json({ message: 'Project not found' });

        const tasksToCreate = template.tasks.map(t => ({
            title: t.title,
            description: t.description,
            priority: t.priority,
            estimatedHours: t.estimatedHours,
            projectId: project._id,
            projectName: project.name,
            tenantId,
            createdBy: userId,
            status: 'pending'
        }));

        const createdTasks = await Task.insertMany(tasksToCreate);

        await logActivity(req, {
            action: 'Applied Project Template',
            severity: 'info',
            resourceId: project._id,
            resourceType: 'Project',
            details: { templateName: template.name, taskCount: createdTasks.length }
        });

        res.status(201).json({ message: 'Template applied successfully', taskCount: createdTasks.length });
    } catch (err) {
        res.status(500).json({ message: 'Failed to apply template', error: err.message });
    }
};

module.exports = { getTemplates, createTemplate, applyTemplate };
