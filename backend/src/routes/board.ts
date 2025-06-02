import { Router } from 'express';
import { BoardController } from '../controllers/boardController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All board routes require authentication
router.use(authenticateToken);

// GET /board/all/items - Get all board items across all user projects (must be before other routes)
router.get('/all/items', BoardController.getAllBoardItems);

// POST /board/:projectId - Create a new board item
router.post('/:projectId', BoardController.createBoardItem);

// GET /board/:projectId/items - Get all board items for a project
router.get('/:projectId/items', BoardController.getBoardItems);

// GET /board/:projectId/stats - Get board statistics
router.get('/:projectId/stats', BoardController.getBoardStats);

// GET /board/:projectId/:itemId - Get a single board item
router.get('/:projectId/:itemId', BoardController.getBoardItem);

// PUT /board/:projectId/:itemId - Update a board item
router.put('/:projectId/:itemId', BoardController.updateBoardItem);

// DELETE /board/:projectId/:itemId - Delete a board item
router.delete('/:projectId/:itemId', BoardController.deleteBoardItem);

// PATCH /board/:projectId/bulk - Bulk operations on board items
router.patch('/:projectId/bulk', BoardController.bulkUpdateBoardItems);

export default router;
