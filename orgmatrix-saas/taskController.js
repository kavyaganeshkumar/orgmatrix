const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const logActivity = require('../utils/logger');
const { createNotification } = require('./notificationController');
const { sendEmail } = require('../utils/emailService');

const MANAGER_ROLES = ['admin', 'super_admin', 'project_manager', 'team_lead'];
const ADMIN_ROLES   = ['admin', 'super_admin'];

// GET /api/tasks  — role-filtered
const getTasks = async (req, res) => {
  try {
    const { role, id: userId, tenantId } = req.user;
    const isAdminOrHR = ['admin', 'super_admin', 'hr_manager'].includes(role);
    let query = role === 'super_admin' ? {} : { tenantId };

    if (!isAdminOrHR) {
        // Find projects this person owns or manages
        const myProjects = await Project.find({ 
            tenantId, 
            $or: [{ owner: userId }, { assignedTo: userId }] 
        }).select('_id');
        const myProjectIds = myProjects.map(p => p._id);

        // Can see tasks if: assigned to me OR belongs to a project I manage
        query.$or = [
            { assignedTo: userId },
            { projectId: { $in: myProjectIds } }
        ];
    }

    // Optional: filter by projectId query param
    if (req.query.projectId) {
      query.projectId = req.query.projectId;
    }

    const tasks = await Task.find(query).sort({ createdAt: -1 });
    res.status(200).json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching tasks', error: err.message });
  }
};

// POST /api/tasks  — admin, PM, team_lead only
const createTask = async (req, res) => {
  try {
    const { role, id: userId, tenantId } = req.user;
    if (!MANAGER_ROLES.includes(role)) {
      return res.status(403).json({ message: 'Only managers can create tasks' });
    }

    const { 
      title, description, projectId, projectName, assignedTo, assignedToName, 
      priority, deadline, status, checklists, order, estimatedHours, blockedBy 
    } = req.body;

    if (!title || !projectId) {
      return res.status(400).json({ message: 'Title and Project are required' });
    }

    // Verify project belongs to this tenant
    const project = await Project.findOne({ _id: projectId, tenantId });
    if (!project) {
      return res.status(404).json({ message: 'Project not found in your organization' });
    }

    const task = await Task.create({
      title,
      description,
      projectId,
      projectName: projectName || project.name,
      assignedTo: assignedTo || null,
      assignedToName: assignedToName || 'Unassigned',
      priority: priority || 'medium',
      deadline: deadline || null,
      status: status || 'pending',
      checklists: checklists || [],
      order: order || 0,
      estimatedHours: estimatedHours || 0,
      blockedBy: blockedBy || null,
      tenantId,
      createdBy: userId
    });

    await logActivity(req, {
      action: 'Created Task',
      severity: 'info',
      resourceId: task._id,
      resourceType: 'Task',
      details: { taskTitle: task.title, project: task.projectName }
    });

    // 🔔 Create Notification
    if (task.assignedTo) {
        await createNotification(req.app, {
            tenantId,
            recipient: task.assignedTo,
            title: 'New Task Assigned',
            message: `You have been assigned a new task: ${task.title} in project ${task.projectName}`,
            type: 'task',
            link: '/dashboard.html#tasks'
        });

        // 📧 Send Email (optional/async)
        try {
            const assigneeUser = await User.findById(task.assignedTo);
            if (assigneeUser && assigneeUser.email) {
                await sendEmail({
                    email: assigneeUser.email,
                    subject: 'New Task Assigned - OrgMatrix',
                    message: `Hello ${assigneeUser.name || 'Team Member'},\n\nYou have been assigned a new task: "${task.title}" in project "${task.projectName}".\n\nDeadline: ${task.deadline || 'None'}\n\nLogin to your dashboard to view details.`
                });
            }
        } catch (emailErr) {
            console.error("Email notification failed:", emailErr.message);
        }
    }

    res.status(201).json(task);
  } catch (err) {
    res.status(400).json({ message: 'Failed to create task', error: err.message });
  }
};

// PATCH /api/tasks/:id/status  — assignee or manager can update status
const updateTaskStatus = async (req, res) => {
  try {
    const { role, id: userId, tenantId } = req.user;
    const { status } = req.body;

    const validStatuses = ['pending', 'in-progress', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const task = await Task.findOne({ _id: req.params.id, tenantId });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // 🕵️ PERMISSION CHECK: 
    // 1. Managers can update ANY task in their tenant
    // 2. ANY role (even Viewers/HR) can update a task IF it is assigned to them specifically
    const isAssignee = String(task.assignedTo) === String(userId);
    const isManager = MANAGER_ROLES.includes(role);

    if (!isManager && !isAssignee) {
      return res.status(403).json({ message: 'You do not have permission to update this task status' });
    }

    task.status = status;
    await task.save();

    await logActivity(req, {
      action: 'Updated Task Status',
      severity: 'warning',
      resourceId: task._id,
      resourceType: 'Task',
      details: { taskTitle: task.title, newStatus: status }
    });
    res.status(200).json(task);
  } catch (err) {
    res.status(400).json({ message: 'Failed to update task', error: err.message });
  }
};

// DELETE /api/tasks/:id  — admin & PM only
const deleteTask = async (req, res) => {
  try {
    const { role, id: userId, tenantId } = req.user;
    if (!MANAGER_ROLES.includes(role)) {
      return res.status(403).json({ message: 'Only managers can delete tasks' });
    }

    const task = await Task.findOneAndDelete({ _id: req.params.id, tenantId });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    await logActivity(req, {
      action: 'Deleted Task',
      severity: 'danger',
      resourceId: task._id,
      resourceType: 'Task',
      details: { taskTitle: task.title }
    });
    res.status(200).json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete task', error: err.message });
  }
};

// PATCH /api/tasks/:id — full update for checklists, time tracking, etc.
const updateTask = async (req, res) => {
  try {
    const { role, id: userId, tenantId } = req.user;
    const updates = req.body;

    const task = await Task.findOne({ _id: req.params.id, tenantId });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Permissions: Assignee or Manager
    const isAssignee = String(task.assignedTo) === String(userId);
    const isManager = MANAGER_ROLES.includes(role);

    if (!isManager && !isAssignee) {
      return res.status(403).json({ message: 'Permission denied' });
    }

    // Prevent non-managers from changing management fields (optional safety)
    if (!isManager) {
      delete updates.estimatedHours;
      delete updates.assignedTo;
    }

    const updatedTask = await Task.findByIdAndUpdate(req.params.id, updates, { new: true });

    await logActivity(req, {
      action: 'Updated Task Details',
      severity: 'info',
      resourceId: updatedTask._id,
      resourceType: 'Task',
      details: { taskTitle: updatedTask.title, updatedFields: Object.keys(updates) }
    });

    res.status(200).json(updatedTask);
  } catch (err) {
    res.status(400).json({ message: 'Failed to update task', error: err.message });
  }
};

module.exports = { getTasks, createTask, updateTaskStatus, updateTask, deleteTask };
