import { Request, Response } from 'express';
import { analyticsConfig, analyticsService } from '../config/analytics';
import {
  ProjectModel,
  createProjectSchema,
  projectListQuerySchema,
  updateProjectSchema,
} from '../models/Project';
import {
  CreateProjectRequest,
  ProjectListQuery,
  UpdateProjectRequest,
} from '../types/project';

export class ProjectController {
  // POST /projects - Create a new project
  static async createProject(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      // Validate request body
      const validationResult = createProjectSchema.safeParse(req.body);
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

      const projectData: CreateProjectRequest = validationResult.data;
      const project = await ProjectModel.create(req.user.userId, projectData);

      // Track analytics event
      try {
        await analyticsService.track(
          analyticsConfig.events.projectCreated,
          {
            userId: req.user.userId,
            projectId: project.id,
            projectName: project.name,
            projectUrl: project.url,
            userAgent: req.headers['user-agent'],
            ip: req.ip,
            timestamp: new Date().toISOString(),
          },
          projectData.goatcounter_site_code || undefined
        );
      } catch (analyticsError) {
        console.error('Analytics tracking failed:', analyticsError);
        // Don't fail the creation if analytics fails
      }

      res.status(201).json({
        success: true,
        project,
      });
    } catch (error) {
      console.error('Create project error:', error);
      res.status(500).json({
        error: 'Failed to create project',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // GET /projects - Get all projects for the authenticated user
  static async getProjects(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      // Validate query parameters
      const validationResult = projectListQuerySchema.safeParse(req.query);
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

      const query: ProjectListQuery = validationResult.data;
      const result = await ProjectModel.findByUserId(req.user.userId, query);

      res.status(200).json({
        success: true,
        projects: result.projects,
        total: result.total,
        page: query.page || 1,
        limit: query.limit || 20,
      });
    } catch (error) {
      console.error('Get projects error:', error);
      res.status(500).json({
        error: 'Failed to fetch projects',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // GET /projects/:id - Get a single project with board items statistics
  static async getProject(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { id } = req.params;
      if (!id) {
        res.status(400).json({ error: 'Project ID is required' });
        return;
      }

      const project = await ProjectModel.findById(id, req.user.userId);

      if (!project) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }

      res.status(200).json({
        success: true,
        project,
      });
    } catch (error) {
      console.error('Get project error:', error);
      res.status(500).json({
        error: 'Failed to fetch project',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // PUT /projects/:id - Update a project
  static async updateProject(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { id } = req.params;
      if (!id) {
        res.status(400).json({ error: 'Project ID is required' });
        return;
      }

      // Validate request body
      const validationResult = updateProjectSchema.safeParse(req.body);
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

      const updateData: UpdateProjectRequest = validationResult.data;
      const project = await ProjectModel.update(
        id,
        req.user.userId,
        updateData
      );

      if (!project) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }

      res.status(200).json({
        success: true,
        project,
      });
    } catch (error) {
      console.error('Update project error:', error);
      res.status(500).json({
        error: 'Failed to update project',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // DELETE /projects/:id - Delete a project
  static async deleteProject(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { id } = req.params;
      if (!id) {
        res.status(400).json({ error: 'Project ID is required' });
        return;
      }

      // Get project details before deletion for analytics
      const project = await ProjectModel.findById(id, req.user.userId);

      if (!project) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }

      await ProjectModel.delete(id, req.user.userId);

      // Track analytics event
      try {
        await analyticsService.track(
          analyticsConfig.events.projectDeleted,
          {
            userId: req.user.userId,
            projectId: id,
            projectName: project?.name || 'Unknown',
            userAgent: req.headers['user-agent'],
            ip: req.ip,
            timestamp: new Date().toISOString(),
          },
          project.goatcounter_site_code || undefined
        );
      } catch (analyticsError) {
        console.error('Analytics tracking failed:', analyticsError);
        // Don't fail the deletion if analytics fails
      }

      res.status(200).json({
        success: true,
        message: 'Project deleted successfully',
      });
    } catch (error) {
      console.error('Delete project error:', error);
      res.status(500).json({
        error: 'Failed to delete project',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
