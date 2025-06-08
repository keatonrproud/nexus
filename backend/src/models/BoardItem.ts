import { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { getSupabase } from '../config/database';
import {
  BoardItem,
  BoardItemListQuery,
  BulkDeleteRequest,
  BulkUpdateRequest,
  CreateBoardItemRequest,
  UpdateBoardItemRequest,
} from '../types/boardItem';

// Validation schemas
export const createBoardItemSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim(),
  description: z
    .string()
    .max(2000, 'Description must be less than 2000 characters')
    .optional()
    .nullable(),
  type: z.enum(['bug', 'idea'], {
    errorMap: () => ({ message: 'Type must be either "bug" or "idea"' }),
  }),
  priority: z.enum(['now', 'later']).optional().default('later'),
});

export const updateBoardItemSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim()
    .optional(),
  description: z
    .string()
    .max(2000, 'Description must be less than 2000 characters')
    .optional()
    .nullable(),
  type: z
    .enum(['bug', 'idea'], {
      errorMap: () => ({ message: 'Type must be either "bug" or "idea"' }),
    })
    .optional(),
  priority: z.enum(['now', 'later']).optional(),
});

export const boardItemListQuerySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1)).optional(),
  limit: z
    .string()
    .transform(Number)
    .pipe(z.number().min(1).max(100))
    .optional(),
  search: z.string().max(100).optional(),
  type: z.enum(['bug', 'idea']).optional(),
  priority: z.enum(['now', 'later']).optional(),
  sort: z.enum(['title', 'created_at', 'updated_at', 'priority']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

export const bulkUpdateSchema = z.object({
  itemIds: z
    .array(z.string().uuid('Invalid item ID'))
    .min(1, 'At least one item ID is required'),
  updates: z
    .object({
      priority: z.enum(['now', 'later']).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one update field is required',
    }),
});

export const bulkDeleteSchema = z.object({
  itemIds: z
    .array(z.string().uuid('Invalid item ID'))
    .min(1, 'At least one item ID is required'),
});

// Get Supabase client - Use shared instance
function getSupabaseClient(): SupabaseClient {
  return getSupabase();
}

export class BoardItemModel {
  // Create a new board item
  static async create(
    projectId: string,
    userId: string,
    itemData: CreateBoardItemRequest
  ): Promise<BoardItem> {
    const supabase = getSupabaseClient();

    // First verify that the user owns the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (projectError || !project) {
      throw new Error('Project not found or access denied');
    }

    const { data, error } = await supabase
      .from('board_items')
      .insert({
        project_id: projectId,
        title: itemData.title,
        description: itemData.description || null,
        type: itemData.type,
        priority: itemData.priority || 'later',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create board item: ${error.message}`);
    }

    return data;
  }

  // Get all board items for a project
  static async findByProjectId(
    projectId: string,
    userId: string,
    query: BoardItemListQuery = {}
  ): Promise<{ items: BoardItem[]; total: number }> {
    const supabase = getSupabaseClient();

    // First verify that the user owns the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (projectError || !project) {
      throw new Error('Project not found or access denied');
    }

    const page = query.page || 1;
    const limit = query.limit || 50;
    const offset = (page - 1) * limit;
    const sort = query.sort || 'created_at';
    const order = query.order || 'desc';

    let queryBuilder = supabase
      .from('board_items')
      .select('*', { count: 'exact' })
      .eq('project_id', projectId);

    // Add filters
    if (query.search) {
      queryBuilder = queryBuilder.or(
        `title.ilike.%${query.search}%,description.ilike.%${query.search}%`
      );
    }

    if (query.type) {
      queryBuilder = queryBuilder.eq('type', query.type);
    }

    if (query.priority) {
      queryBuilder = queryBuilder.eq('priority', query.priority);
    }

    // Add sorting
    queryBuilder = queryBuilder.order(sort, { ascending: order === 'asc' });

    // Add pagination
    queryBuilder = queryBuilder.range(offset, offset + limit - 1);

    const { data, error, count } = await queryBuilder;

    if (error) {
      throw new Error(`Failed to fetch board items: ${error.message}`);
    }

    return {
      items: data || [],
      total: count || 0,
    };
  }

  // Get a single board item by ID
  static async findByIdAndProjectId(
    itemId: string,
    projectId: string,
    userId: string
  ): Promise<BoardItem | null> {
    const supabase = getSupabaseClient();

    // First verify that the user owns the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (projectError || !project) {
      throw new Error('Project not found or access denied');
    }

    const { data, error } = await supabase
      .from('board_items')
      .select('*')
      .eq('id', itemId)
      .eq('project_id', projectId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to fetch board item: ${error.message}`);
    }

    return data;
  }

  // Update a board item
  static async update(
    itemId: string,
    projectId: string,
    userId: string,
    updateData: UpdateBoardItemRequest
  ): Promise<BoardItem | null> {
    const supabase = getSupabaseClient();

    // First verify that the user owns the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (projectError || !project) {
      throw new Error('Project not found or access denied');
    }

    const { data, error } = await supabase
      .from('board_items')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', itemId)
      .eq('project_id', projectId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to update board item: ${error.message}`);
    }

    return data;
  }

  // Delete a board item
  static async delete(
    itemId: string,
    projectId: string,
    userId: string
  ): Promise<boolean> {
    const supabase = getSupabaseClient();

    // First verify that the user owns the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (projectError || !project) {
      throw new Error('Project not found or access denied');
    }

    const { error } = await supabase
      .from('board_items')
      .delete()
      .eq('id', itemId)
      .eq('project_id', projectId);

    if (error) {
      throw new Error(`Failed to delete board item: ${error.message}`);
    }

    return true;
  }

  // Bulk update board items
  static async bulkUpdate(
    projectId: string,
    userId: string,
    bulkData: BulkUpdateRequest
  ): Promise<{ updated: number }> {
    const supabase = getSupabaseClient();

    // First verify that the user owns the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (projectError || !project) {
      throw new Error('Project not found or access denied');
    }

    const { data, error } = await supabase
      .from('board_items')
      .update({
        ...bulkData.updates,
        updated_at: new Date().toISOString(),
      })
      .in('id', bulkData.itemIds)
      .eq('project_id', projectId)
      .select('id');

    if (error) {
      throw new Error(`Failed to bulk update board items: ${error.message}`);
    }

    return { updated: data?.length || 0 };
  }

  // Bulk delete board items
  static async bulkDelete(
    projectId: string,
    userId: string,
    bulkData: BulkDeleteRequest
  ): Promise<{ deleted: number }> {
    const supabase = getSupabaseClient();

    // First verify that the user owns the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (projectError || !project) {
      throw new Error('Project not found or access denied');
    }

    const { data, error } = await supabase
      .from('board_items')
      .delete()
      .in('id', bulkData.itemIds)
      .eq('project_id', projectId)
      .select('id');

    if (error) {
      throw new Error(`Failed to bulk delete board items: ${error.message}`);
    }

    return { deleted: data?.length || 0 };
  }

  // Get board statistics for a project
  static async getProjectStats(
    projectId: string,
    userId: string
  ): Promise<{
    total: number;
    bugs: number;
    ideas: number;
    byPriority: {
      now: number;
      later: number;
    };
  }> {
    const supabase = getSupabaseClient();

    // First verify that the user owns the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (projectError || !project) {
      throw new Error('Project not found or access denied');
    }

    const { data, error } = await supabase
      .from('board_items')
      .select('type, priority')
      .eq('project_id', projectId);

    if (error) {
      throw new Error(`Failed to fetch board statistics: ${error.message}`);
    }

    const items = data || [];

    return {
      total: items.length,
      bugs: items.filter((item) => item.type === 'bug').length,
      ideas: items.filter((item) => item.type === 'idea').length,
      byPriority: {
        now: items.filter((item) => item.priority === 'now').length,
        later: items.filter((item) => item.priority === 'later').length,
      },
    };
  }

  // Get all board items across all user projects
  static async findByUserId(
    userId: string,
    query: BoardItemListQuery = {}
  ): Promise<{ items: BoardItem[]; total: number }> {
    const supabase = getSupabaseClient();

    const page = query.page || 1;
    const limit = query.limit || 50;
    const offset = (page - 1) * limit;
    const sort = query.sort || 'created_at';
    const order = query.order || 'desc';

    // First get all project IDs that belong to the user
    const { data: userProjects, error: projectsError } = await supabase
      .from('projects')
      .select('id')
      .eq('user_id', userId);

    if (projectsError) {
      throw new Error(
        `Failed to fetch user projects: ${projectsError.message}`
      );
    }

    if (!userProjects || userProjects.length === 0) {
      return { items: [], total: 0 };
    }

    const projectIds = userProjects.map((p) => p.id);

    let queryBuilder = supabase
      .from('board_items')
      .select('*', { count: 'exact' })
      .in('project_id', projectIds);

    // Add filters
    if (query.search) {
      queryBuilder = queryBuilder.or(
        `title.ilike.%${query.search}%,description.ilike.%${query.search}%`
      );
    }

    if (query.type) {
      queryBuilder = queryBuilder.eq('type', query.type);
    }

    if (query.priority) {
      queryBuilder = queryBuilder.eq('priority', query.priority);
    }

    // Add sorting
    queryBuilder = queryBuilder.order(sort, { ascending: order === 'asc' });

    // Add pagination
    queryBuilder = queryBuilder.range(offset, offset + limit - 1);

    const { data, error, count } = await queryBuilder;

    if (error) {
      throw new Error(`Failed to fetch board items: ${error.message}`);
    }

    return {
      items: data || [],
      total: count || 0,
    };
  }
}
