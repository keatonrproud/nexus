import { Router } from 'express';
import { ProjectController } from '../controllers/projectController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All project routes require authentication
router.use(authenticateToken);

// POST /projects - Create a new project
router.post('/', ProjectController.createProject);

// GET /projects - Get all projects for the authenticated user
router.get('/', ProjectController.getProjects);

// GET /projects/:id - Get a single project with board items statistics
router.get('/:id', ProjectController.getProject);

// PUT /projects/:id - Update a project
router.put('/:id', ProjectController.updateProject);

// DELETE /projects/:id - Delete a project
router.delete('/:id', ProjectController.deleteProject);

export default router;
