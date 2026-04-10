const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const checkLimit = require('../middleware/checkLimit');
const upload = require('../middleware/multerConfig');
const ProjectDocument = require('../models/ProjectDocument');
const { testProjectAPI, getProjects, getProjectTeamMembers, createProject, deleteProject, restoreProject } = require('../controllers/projectController');
const logActivity = require('../utils/logger');

// 8. ✅ TEST ENDPOINT (Accessible at /api/projects/test)
router.get('/test', protect, testProjectAPI);

// 2. ✅ ROUTE REGISTRATION (PROJECTS)
// GET /api/projects - Returns this tenant's projects
// POST /api/projects - Creates a new project for this tenant
router.get('/', protect, getProjects);
router.get('/team-members', protect, getProjectTeamMembers);
router.post('/', protect, checkLimit('projects'), createProject);
router.delete('/:id', protect, deleteProject);
router.patch('/:id/restore', protect, restoreProject);

// 📄 File Management Routes
// @route   POST /api/projects/:id/documents
router.post('/:id/documents', protect, upload.single('document'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

        const doc = await ProjectDocument.create({
            name: req.body.name || req.file.originalname,
            fileUrl: `/uploads/documents/${req.file.filename}`,
            fileType: req.file.mimetype,
            fileSize: req.file.size,
            projectId: req.params.id,
            tenantId: req.user.tenantId,
            uploadedBy: req.user.id
        });

        await logActivity(req, {
            action: 'Uploaded Document',
            severity: 'info',
            resourceId: doc._id,
            resourceType: 'Document',
            details: { fileName: doc.name, projectId: req.params.id }
        });

        res.status(201).json(doc);
    } catch (err) {
        res.status(500).json({ message: 'Upload failed', error: err.message });
    }
});

// @route   GET /api/projects/:id/documents
router.get('/:id/documents', protect, async (req, res) => {
    try {
        const docs = await ProjectDocument.find({ 
            projectId: req.params.id, 
            tenantId: req.user.tenantId 
        }).populate('uploadedBy', 'email');
        res.status(200).json(docs);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching documents', error: err.message });
    }
});

module.exports = router;
