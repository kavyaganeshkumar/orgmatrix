const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const logActivity = require('../utils/logger');

// 8. ✅ TEST ENDPOINT
// @route   GET /api/projects/test
const testProjectAPI = (req, res) => {
    console.log('[TEST_ENDPOINT_HIT]: Project API reached success');
    res.status(200).json({ 
        message: 'Project API working correctly and reachable!', 
        user: req.user // confirming auth worked
    });
};

// 3. ✅ CONTROLLER (FETCH) — Role-filtered
// @route   GET /api/projects
const getProjects = async (req, res) => {
  try {
    const { role, id: userId, tenantId } = req.user;
    
    console.log(`[PROJECT_FETCH] tenant=${tenantId} role=${role}`);

    const isAdminOrHR = ['admin', 'super_admin', 'hr_manager'].includes(role);
    let query = req.user.role === 'super_admin' ? { isDeleted: false } : { tenantId, isDeleted: false };

    // STRICT CONTROL: Non-admins (Devs, PMs, Viewers, etc.) only see projects they are explicitly assigned to or own
    if (!isAdminOrHR) {
      query.$or = [{ owner: userId }, { assignedTo: userId }];
    }

    const projects = await Project.find(query).sort({ createdAt: -1 });
    
    // Enrich projects with task progress
    const enrichedProjects = await Promise.all(projects.map(async (project) => {
        const totalTasks = await Task.countDocuments({ projectId: project._id });
        const completedTasks = await Task.countDocuments({ projectId: project._id, status: 'completed' });
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        
        return {
            ...project.toObject(),
            progress,
            totalTasks,
            completedTasks
        };
    }));

    console.log(`[PROJECT_FETCH_SUCCESS]: Found ${enrichedProjects.length} records with progress`);
    res.status(200).json(enrichedProjects);
  } catch (err) {
    console.error(`[PROJECT_FETCH_FAILURE]: ${err.message}`);
    res.status(500).json({ message: 'Error retrieving projects', error: err.message });
  }
};

// 3. ✅ CONTROLLER (CREATE)
// @route   POST /api/projects
const createProject = async (req, res) => {
  try {
    const allowedRoles = ['admin', 'super_admin', 'project_manager'];
    if (!req.user || !allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Only Admins and Project Managers can create projects' });
    }

    console.log('[PROJECT_SAVE] Incoming payload:', JSON.stringify(req.body));
    
    // 5. DEBUG TENANT ID
    if (!req.user || !req.user.tenantId) {
        console.error('[PROJECT_SAVE_ERROR]: tenantId missing from request context');
        return res.status(401).json({ message: 'Authorization error: Tenant ID not injected' });
    }

    const { name, budget, deadline, description, assignedTo, handlerName, status } = req.body;
    
    // Explicit Validation before DB hit
    if (!name || !budget || !deadline) {
        console.error('[PROJECT_SAVE_ERROR]: Name, Budget, and Deadline are missing in the request');
        return res.status(400).json({ message: 'Please fill name, budget and deadline to create a project' });
    }

    // Creating via instance save
    const project = new Project({
      name,
      budget,
      deadline,
      description,
      assignedTo: assignedTo || null,
      handlerName: handlerName || 'Unassigned',
      status: status || 'pending',
      tenantId: req.user.tenantId, // FORCED Isolation
      owner: req.user.id
    });

    const newProject = await project.save();
    console.log(`[PROJECT_SAVE_SUCCESS]: Document stored with ID: ${newProject._id}`);

    // Log the event for Admin Dashboard
    await logActivity(req, {
        action: 'Created Project',
        severity: 'info',
        resourceId: newProject._id,
        resourceType: 'Project',
        details: { projectName: newProject.name, budget: newProject.budget }
    });

    res.status(201).json(newProject);
  } catch (err) {
    console.error(`[PROJECT_SAVE_CRITICAL_DB_FAILURE]: ${err.message}`);
    res.status(400).json({ message: 'Failed to save project to MongoDB', dbError: err.message });
  }
};

// @desc    Soft delete project
// @route   DELETE /api/projects/:id
const deleteProject = async (req, res) => {
    try {
        const project = await Project.findOne({ _id: req.params.id, tenantId: req.user.tenantId });
        if (!project) return res.status(404).json({ message: 'Project not found' });

        project.isDeleted = true;
        project.deletedAt = new Date();
        await project.save();

        await logActivity(req, {
            action: 'Soft Deleted Project',
            severity: 'warning',
            resourceId: project._id,
            resourceType: 'Project',
            details: { name: project.name }
        });

        res.status(200).json({ message: 'Project moved to trash', id: project._id });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// @desc    Restore soft deleted project
// @route   PATCH /api/projects/:id/restore
const restoreProject = async (req, res) => {
    try {
        const project = await Project.findOne({ _id: req.params.id, tenantId: req.user.tenantId, isDeleted: true });
        if (!project) return res.status(404).json({ message: 'Deleted project not found' });

        project.isDeleted = false;
        project.deletedAt = null;
        await project.save();

        await logActivity(req, {
            action: 'Restored Project',
            severity: 'info',
            resourceId: project._id,
            resourceType: 'Project',
            details: { name: project.name }
        });

        res.status(200).json({ message: 'Project restored successfully', project });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// @desc    Get members working on same projects as current user
// @route   GET /api/projects/team-members
const getProjectTeamMembers = async (req, res) => {
    try {
        const { id: userId, tenantId, role } = req.user;

        // 1. Find all projects the user is involved in
        // (Owns, Assigned to, or has tasks in)
        const myDirectProjects = await Project.find({
            tenantId,
            isDeleted: false,
            $or: [{ owner: userId }, { assignedTo: userId }]
        }).select('_id');

        const myTaskProjects = await Task.find({ 
            tenantId, 
            assignedTo: userId 
        }).distinct('projectId');

        const involvedProjectIds = [...new Set([
            ...myDirectProjects.map(p => p._id.toString()),
            ...myTaskProjects.map(id => id.toString())
        ])];

        if (involvedProjectIds.length === 0) {
            return res.status(200).json([]);
        }

        // 2. Find all users involved in these same projects
        // (Project owners, Project assignees, and anyone with a task in these projects)
        const projectParticipants = await Project.find({
            _id: { $in: involvedProjectIds }
        }).select('owner assignedTo');

        const taskAssignees = await Task.find({
            projectId: { $in: involvedProjectIds }
        }).distinct('assignedTo');

        const teamMemberIds = new Set();
        projectParticipants.forEach(p => {
            if (p.owner) teamMemberIds.add(p.owner.toString());
            if (p.assignedTo) teamMemberIds.add(p.assignedTo.toString());
        });
        taskAssignees.forEach(id => {
            if (id) teamMemberIds.add(id.toString());
        });

        // 3. Remove self from the list
        teamMemberIds.delete(userId.toString());

        // 4. Fetch details for these users
        const teamMembers = await User.find({
            _id: { $in: Array.from(teamMemberIds) }
        }).select('email role lastActive companyName');

        res.status(200).json(teamMembers);
    } catch (err) {
        console.error(`[TEAM_MEMBERS_FETCH_FAILURE]: ${err.message}`);
        res.status(500).json({ message: 'Error retrieving team members', error: err.message });
    }
};

module.exports = {
    testProjectAPI,
    getProjects,
    getProjectTeamMembers,
    createProject,
    deleteProject,
    restoreProject
};
