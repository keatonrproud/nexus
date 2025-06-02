import { Request, Response } from 'express';
import { analyticsConfig, analyticsService } from '../config/analytics';
import {
  boardItemListQuerySchema,
  BoardItemModel,
  bulkDeleteSchema,
  bulkUpdateSchema,
  createBoardItemSchema,
  updateBoardItemSchema,
} from '../models/BoardItem';
import {
  BoardItemListQuery,
  BulkDeleteRequest,
  BulkUpdateRequest,
  CreateBoardItemRequest,
  UpdateBoardItemRequest,
} from '../types/boardItem';

export class BoardController {
  // POST /projects/:projectId/board - Create a new board item
  static async createBoardItem(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { projectId } = req.params;
      if (!projectId) {
        res.status(400).json({ error: 'Project ID is required' });
        return;
      }

      // Validate request body
      const validationResult = createBoardItemSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({
          error: 'Validation failed',
          details: validationResult.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }

      const itemData: CreateBoardItemRequest = validationResult.data;
      const item = await BoardItemModel.create(
        projectId,
        req.user.userId,
        itemData
      );

      // Track analytics event
      try {
        const eventType =
          item.type === 'bug'
            ? analyticsConfig.events.bugReported
            : analyticsConfig.events.ideaCreated;
        await analyticsService.track(eventType, {
          userId: req.user.userId,
          projectId,
          itemId: item.id,
          itemType: item.type,
          itemPriority: item.priority,
          userAgent: req.headers['user-agent'],
          ip: req.ip,
          timestamp: new Date().toISOString(),
        });
      } catch (analyticsError) {
        console.error('Analytics tracking failed:', analyticsError);
        // Don't fail the creation if analytics fails
      }

      res.status(201).json({
        success: true,
        item,
      });
    } catch (error) {
      console.error('Create board item error:', error);
      res.status(500).json({
        error: 'Failed to create board item',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // GET /projects/:projectId/board - Get all board items for a project
  static async getBoardItems(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { projectId } = req.params;
      if (!projectId) {
        res.status(400).json({ error: 'Project ID is required' });
        return;
      }

      // Validate query parameters
      const validationResult = boardItemListQuerySchema.safeParse(req.query);
      if (!validationResult.success) {
        res.status(400).json({
          error: 'Invalid query parameters',
          details: validationResult.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }

      const query: BoardItemListQuery = validationResult.data;
      const result = await BoardItemModel.findByProjectId(
        projectId,
        req.user.userId,
        query
      );

      res.status(200).json({
        success: true,
        items: result.items,
        total: result.total,
        page: query.page || 1,
        limit: query.limit || 50,
      });
    } catch (error) {
      console.error('Get board items error:', error);
      res.status(500).json({
        error: 'Failed to fetch board items',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // GET /projects/:projectId/board/:itemId - Get a single board item
  static async getBoardItem(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { projectId, itemId } = req.params;
      if (!projectId || !itemId) {
        res.status(400).json({ error: 'Project ID and Item ID are required' });
        return;
      }

      const item = await BoardItemModel.findByIdAndProjectId(
        itemId,
        projectId,
        req.user.userId
      );

      if (!item) {
        res.status(404).json({ error: 'Board item not found' });
        return;
      }

      res.status(200).json({
        success: true,
        item,
      });
    } catch (error) {
      console.error('Get board item error:', error);
      res.status(500).json({
        error: 'Failed to fetch board item',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // PUT /projects/:projectId/board/:itemId - Update a board item
  static async updateBoardItem(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { projectId, itemId } = req.params;
      if (!projectId || !itemId) {
        res.status(400).json({ error: 'Project ID and Item ID are required' });
        return;
      }

      // Get current item for analytics comparison
      const currentItem = await BoardItemModel.findByIdAndProjectId(
        itemId,
        projectId,
        req.user.userId
      );

      // Validate request body
      const validationResult = updateBoardItemSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({
          error: 'Validation failed',
          details: validationResult.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }

      const updateData: UpdateBoardItemRequest = validationResult.data;
      const item = await BoardItemModel.update(
        itemId,
        projectId,
        req.user.userId,
        updateData
      );

      if (!item) {
        res.status(404).json({ error: 'Board item not found' });
        return;
      }

      // Track analytics events for priority changes
      try {
        if (
          currentItem &&
          updateData.priority &&
          currentItem.priority !== updateData.priority
        ) {
          await analyticsService.track(
            analyticsConfig.events.itemPriorityChanged,
            {
              userId: req.user.userId,
              projectId,
              itemId,
              itemType: item.type,
              oldPriority: currentItem.priority,
              newPriority: updateData.priority,
              userAgent: req.headers['user-agent'],
              ip: req.ip,
              timestamp: new Date().toISOString(),
            }
          );
        }
      } catch (analyticsError) {
        console.error('Analytics tracking failed:', analyticsError);
        // Don't fail the update if analytics fails
      }

      res.status(200).json({
        success: true,
        item,
      });
    } catch (error) {
      console.error('Update board item error:', error);
      res.status(500).json({
        error: 'Failed to update board item',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // DELETE /projects/:projectId/board/:itemId - Delete a board item
  static async deleteBoardItem(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { projectId, itemId } = req.params;
      if (!projectId || !itemId) {
        res.status(400).json({ error: 'Project ID and Item ID are required' });
        return;
      }

      // Get item details before deletion for analytics
      const item = await BoardItemModel.findByIdAndProjectId(
        itemId,
        projectId,
        req.user.userId
      );

      const success = await BoardItemModel.delete(
        itemId,
        projectId,
        req.user.userId
      );

      if (!success) {
        res.status(404).json({ error: 'Board item not found' });
        return;
      }

      // Track analytics event
      try {
        await analyticsService.track(analyticsConfig.events.itemDeleted, {
          userId: req.user.userId,
          projectId,
          itemId,
          itemTitle: item?.title || 'unknown',
          itemType: item?.type || 'unknown',
          itemPriority: item?.priority || 'unknown',
          userAgent: req.headers['user-agent'],
          ip: req.ip,
          timestamp: new Date().toISOString(),
        });
      } catch (analyticsError) {
        console.error('Analytics tracking failed:', analyticsError);
        // Don't fail the deletion if analytics fails
      }

      res.status(200).json({
        success: true,
        message: 'Board item deleted successfully',
      });
    } catch (error) {
      console.error('Delete board item error:', error);
      res.status(500).json({
        error: 'Failed to delete board item',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // PATCH /projects/:projectId/board/bulk - Bulk operations on board items
  static async bulkUpdateBoardItems(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { projectId } = req.params;
      if (!projectId) {
        res.status(400).json({ error: 'Project ID is required' });
        return;
      }

      const { operation } = req.body;

      if (operation === 'update') {
        // Validate bulk update request
        const validationResult = bulkUpdateSchema.safeParse(req.body);
        if (!validationResult.success) {
          res.status(400).json({
            error: 'Validation failed',
            details: validationResult.error.errors.map((err) => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          });
          return;
        }

        const bulkData: BulkUpdateRequest = validationResult.data;
        const result = await BoardItemModel.bulkUpdate(
          projectId,
          req.user.userId,
          bulkData
        );

        res.status(200).json({
          success: true,
          updated: result.updated,
          message: `Successfully updated ${result.updated} board items`,
        });
      } else if (operation === 'delete') {
        // Validate bulk delete request
        const validationResult = bulkDeleteSchema.safeParse(req.body);
        if (!validationResult.success) {
          res.status(400).json({
            error: 'Validation failed',
            details: validationResult.error.errors.map((err) => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          });
          return;
        }

        const bulkData: BulkDeleteRequest = validationResult.data;
        const result = await BoardItemModel.bulkDelete(
          projectId,
          req.user.userId,
          bulkData
        );

        res.status(200).json({
          success: true,
          deleted: result.deleted,
          message: `Successfully deleted ${result.deleted} board items`,
        });
      } else {
        res.status(400).json({
          error: 'Invalid operation',
          details: 'Operation must be either "update" or "delete"',
        });
      }
    } catch (error) {
      console.error('Bulk operation error:', error);
      res.status(500).json({
        error: 'Failed to perform bulk operation',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // GET /projects/:projectId/board/stats - Get board statistics
  static async getBoardStats(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { projectId } = req.params;
      if (!projectId) {
        res.status(400).json({ error: 'Project ID is required' });
        return;
      }

      const stats = await BoardItemModel.getProjectStats(
        projectId,
        req.user.userId
      );

      res.status(200).json({
        success: true,
        stats,
      });
    } catch (error) {
      console.error('Get board stats error:', error);
      res.status(500).json({
        error: 'Failed to fetch board statistics',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // GET /board/all/items - Get all board items across all user projects
  static async getAllBoardItems(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      // Validate query parameters
      const validationResult = boardItemListQuerySchema.safeParse(req.query);
      if (!validationResult.success) {
        res.status(400).json({
          error: 'Invalid query parameters',
          details: validationResult.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }

      const query: BoardItemListQuery = validationResult.data;
      const result = await BoardItemModel.findByUserId(req.user.userId, query);

      res.status(200).json({
        success: true,
        items: result.items,
        total: result.total,
      });
    } catch (error) {
      console.error('Get all board items error:', error);
      res.status(500).json({
        error: 'Failed to fetch all board items',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
