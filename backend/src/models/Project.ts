import { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { getSupabase } from '../config/database';
import {
  CreateProjectRequest,
  Project,
  ProjectListQuery,
  ProjectWithBoardItems,
  UpdateProjectRequest,
} from '../types/project';

// Validation schemas
export const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, 'Project name is required')
    .max(100, 'Project name must be less than 100 characters')
    .trim(),
  url: z
    .string()
    .url('Please provide a valid URL')
    .max(500, 'URL must be less than 500 characters'),
  emoji: z
    .string()
    .max(10, 'Emoji must be less than 10 characters')
    .optional()
    .nullable(),
  goatcounter_site_code: z
    .string()
    .min(1, 'GoatCounter site code cannot be empty')
    .max(255, 'GoatCounter site code must be less than 255 characters')
    .optional()
    .nullable(),
  goatcounter_api_token: z
    .string()
    .min(1, 'GoatCounter API token cannot be empty')
    .max(500, 'GoatCounter API token must be less than 500 characters')
    .optional()
    .nullable(),
});

export const updateProjectSchema = z.object({
  name: z
    .string()
    .min(1, 'Project name is required')
    .max(100, 'Project name must be less than 100 characters')
    .trim()
    .optional(),
  url: z
    .string()
    .url('Please provide a valid URL')
    .max(500, 'URL must be less than 500 characters')
    .optional(),
  emoji: z
    .string()
    .max(10, 'Emoji must be less than 10 characters')
    .optional()
    .nullable(),
  goatcounter_site_code: z
    .string()
    .min(1, 'GoatCounter site code cannot be empty')
    .max(255, 'GoatCounter site code must be less than 255 characters')
    .optional()
    .nullable(),
  goatcounter_api_token: z
    .string()
    .min(1, 'GoatCounter API token cannot be empty')
    .max(500, 'GoatCounter API token must be less than 500 characters')
    .optional()
    .nullable(),
});

export const projectListQuerySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1)).optional(),
  limit: z
    .string()
    .transform(Number)
    .pipe(z.number().min(1).max(100))
    .optional(),
  search: z.string().max(100).optional(),
  sort: z.enum(['name', 'created_at', 'updated_at']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

// Get Supabase client - Use shared instance
const getSupabaseClient = (): SupabaseClient => {
  return getSupabase();
};

export class ProjectModel {
  // Create a new project
  static async create(
    userId: string,
    projectData: CreateProjectRequest
  ): Promise<Project> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: userId,
        name: projectData.name,
        url: projectData.url,
        emoji: projectData.emoji || null,
        goatcounter_site_code: projectData.goatcounter_site_code || null,
        goatcounter_api_token: projectData.goatcounter_api_token || null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create project: ${error.message}`);
    }

    return data;
  }

  // Get all projects for a user
  static async findByUserId(
    userId: string,
    query: ProjectListQuery = {}
  ): Promise<{
    projects: Project[];
    total: number;
    page: number;
    limit: number;
  }> {
    const supabase = getSupabaseClient();

    const page = query.page || 1;
    const limit = query.limit || 10;
    const offset = (page - 1) * limit;
    const sort = query.sort || 'created_at';
    const order = query.order || 'desc';

    let queryBuilder = supabase
      .from('projects')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    // Add search filter if provided
    if (query.search) {
      queryBuilder = queryBuilder.or(
        `name.ilike.%${query.search}%,url.ilike.%${query.search}%`
      );
    }

    // Add sorting
    queryBuilder = queryBuilder.order(sort, { ascending: order === 'asc' });

    // Add pagination
    queryBuilder = queryBuilder.range(offset, offset + limit - 1);

    const { data, error, count } = await queryBuilder;

    if (error) {
      throw new Error(`Failed to fetch projects: ${error.message}`);
    }

    return {
      projects: data || [],
      total: count || 0,
      page,
      limit,
    };
  }

  // Get a single project by ID
  static async findById(
    projectId: string,
    userId: string
  ): Promise<Project | null> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Project not found
      }
      throw new Error(`Failed to fetch project: ${error.message}`);
    }

    return data;
  }

  // Update a project
  static async update(
    projectId: string,
    userId: string,
    updateData: UpdateProjectRequest
  ): Promise<Project | null> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', projectId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Project not found
      }
      throw new Error(`Failed to update project: ${error.message}`);
    }

    return data;
  }

  // Delete a project
  static async delete(projectId: string, userId: string): Promise<void> {
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to delete project: ${error.message}`);
    }
  }

  // Get project with board items
  static async findByIdWithBoardItems(
    projectId: string,
    userId: string
  ): Promise<ProjectWithBoardItems | null> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('projects')
      .select(
        `
        *,
        board_items (
          id,
          title,
          description,
          type,
          status,
          priority,
          metadata,
          created_at,
          updated_at
        )
      `
      )
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Project not found
      }
      throw new Error(
        `Failed to fetch project with board items: ${error.message}`
      );
    }

    return data;
  }
}
