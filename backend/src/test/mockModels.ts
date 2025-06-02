import {
  BoardItem,
  BoardItemListQuery,
  BulkDeleteRequest,
  BulkUpdateRequest,
  CreateBoardItemRequest,
  UpdateBoardItemRequest,
} from '../types/boardItem';
import {
  CreateProjectRequest,
  Project,
  ProjectListQuery,
  ProjectWithBoardItems,
  UpdateProjectRequest,
} from '../types/project';

// In-memory data store for tests
let users: any[] = [];
let projects: Project[] = [];
let boardItems: BoardItem[] = [];

// Helper function to generate test IDs
const generateId = () => 'test-' + Math.random().toString(36).substr(2, 9);

// Mock validation schemas (simplified for testing)
export const createProjectSchema = {
  safeParse: (data: any) => {
    if (!data.name || !data.url) {
      return {
        success: false,
        error: {
          errors: [
            { path: ['name'], message: 'Project name is required' },
            { path: ['url'], message: 'URL is required' },
          ],
        },
      };
    }
    return { success: true, data };
  },
};

export const updateProjectSchema = {
  safeParse: (data: any) => ({ success: true, data }),
};

export const projectListQuerySchema = {
  safeParse: (data: any) => ({ success: true, data }),
};

export const createBoardItemSchema = {
  safeParse: (data: any) => {
    if (!data.title || !data.type) {
      return {
        success: false,
        error: {
          errors: [
            { path: ['title'], message: 'Title is required' },
            { path: ['type'], message: 'Type is required' },
          ],
        },
      };
    }
    return { success: true, data };
  },
};

export const updateBoardItemSchema = {
  safeParse: (data: any) => ({ success: true, data }),
};

export const boardItemListQuerySchema = {
  safeParse: (data: any) => ({ success: true, data }),
};

export const bulkUpdateSchema = {
  safeParse: (data: any) => {
    if (!data.itemIds || data.itemIds.length === 0) {
      return {
        success: false,
        error: {
          errors: [
            { path: ['itemIds'], message: 'At least one item ID is required' },
          ],
        },
      };
    }
    return { success: true, data };
  },
};

export const bulkDeleteSchema = {
  safeParse: (data: any) => {
    if (!data.itemIds || data.itemIds.length === 0) {
      return {
        success: false,
        error: {
          errors: [
            { path: ['itemIds'], message: 'At least one item ID is required' },
          ],
        },
      };
    }
    return { success: true, data };
  },
};

// Mock Project Model
export const MockProjectModel = {
  async create(
    userId: string,
    projectData: CreateProjectRequest
  ): Promise<Project> {
    const project: Project = {
      id: generateId(),
      user_id: userId,
      name: projectData.name,
      url: projectData.url || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    projects.push(project);
    return project;
  },

  async findByUserId(
    userId: string,
    query: ProjectListQuery = {}
  ): Promise<{
    projects: Project[];
    total: number;
    page: number;
    limit: number;
  }> {
    let userProjects = projects.filter((p) => p.user_id === userId);

    if (query.search) {
      userProjects = userProjects.filter(
        (p) =>
          p.name.toLowerCase().includes(query.search!.toLowerCase()) ||
          p.url?.toLowerCase().includes(query.search!.toLowerCase())
      );
    }

    const page = query.page || 1;
    const limit = query.limit || 10;
    const offset = (page - 1) * limit;

    return {
      projects: userProjects.slice(offset, offset + limit),
      total: userProjects.length,
      page,
      limit,
    };
  },

  async findById(projectId: string, userId: string): Promise<Project | null> {
    return (
      projects.find((p) => p.id === projectId && p.user_id === userId) || null
    );
  },

  async findByIdWithBoardItems(
    projectId: string,
    userId: string
  ): Promise<ProjectWithBoardItems | null> {
    const project = projects.find(
      (p) => p.id === projectId && p.user_id === userId
    );
    if (!project) return null;

    const projectBoardItems = boardItems.filter(
      (item) => item.project_id === projectId
    );

    return {
      ...project,
      board_items: projectBoardItems.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        type: item.type,
        priority: item.priority,
        metadata: {},
        created_at: item.created_at,
        updated_at: item.updated_at,
      })),
    };
  },

  async update(
    projectId: string,
    userId: string,
    updateData: UpdateProjectRequest
  ): Promise<Project | null> {
    const projectIndex = projects.findIndex(
      (p) => p.id === projectId && p.user_id === userId
    );
    if (projectIndex === -1) return null;

    projects[projectIndex] = {
      ...projects[projectIndex],
      ...updateData,
      updated_at: new Date().toISOString(),
    };
    return projects[projectIndex];
  },

  async delete(projectId: string, userId: string): Promise<void> {
    const projectIndex = projects.findIndex(
      (p) => p.id === projectId && p.user_id === userId
    );
    if (projectIndex === -1) throw new Error('Project not found');

    projects.splice(projectIndex, 1);
    // Also delete related board items
    boardItems = boardItems.filter((item) => item.project_id !== projectId);
  },

  async checkOwnership(projectId: string, userId: string): Promise<boolean> {
    return projects.some((p) => p.id === projectId && p.user_id === userId);
  },
};

// Mock Board Item Model
export const MockBoardItemModel = {
  async create(
    projectId: string,
    userId: string,
    itemData: CreateBoardItemRequest
  ): Promise<BoardItem> {
    // Check if project exists and user owns it
    const project = projects.find(
      (p) => p.id === projectId && p.user_id === userId
    );
    if (!project) {
      throw new Error('Project not found or access denied');
    }

    const boardItem: BoardItem = {
      id: generateId(),
      project_id: projectId,
      title: itemData.title,
      description: itemData.description || null,
      type: itemData.type,
      priority: itemData.priority || 'later',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    boardItems.push(boardItem);
    return boardItem;
  },

  async findByProjectId(
    projectId: string,
    userId: string,
    query: BoardItemListQuery = {}
  ): Promise<{ items: BoardItem[]; total: number }> {
    // Check if project exists and user owns it
    const project = projects.find(
      (p) => p.id === projectId && p.user_id === userId
    );
    if (!project) {
      throw new Error('Project not found or access denied');
    }

    let items = boardItems.filter((item) => item.project_id === projectId);

    // Apply filters
    if (query.search) {
      items = items.filter(
        (item) =>
          item.title.toLowerCase().includes(query.search!.toLowerCase()) ||
          (item.description &&
            item.description
              .toLowerCase()
              .includes(query.search!.toLowerCase()))
      );
    }

    if (query.type) {
      items = items.filter((item) => item.type === query.type);
    }

    if (query.priority) {
      items = items.filter((item) => item.priority === query.priority);
    }

    // Apply sorting
    const sort = query.sort || 'created_at';
    const order = query.order || 'desc';
    items.sort((a, b) => {
      const aVal = a[sort as keyof BoardItem] as string;
      const bVal = b[sort as keyof BoardItem] as string;
      if (order === 'asc') {
        return (aVal || '') < (bVal || '')
          ? -1
          : (aVal || '') > (bVal || '')
            ? 1
            : 0;
      } else {
        return (aVal || '') > (bVal || '')
          ? -1
          : (aVal || '') < (bVal || '')
            ? 1
            : 0;
      }
    });

    // Apply pagination
    const page = query.page || 1;
    const limit = query.limit || 50;
    const offset = (page - 1) * limit;

    return {
      items: items.slice(offset, offset + limit),
      total: items.length,
    };
  },

  async findByIdAndProjectId(
    itemId: string,
    projectId: string,
    userId: string
  ): Promise<BoardItem | null> {
    // Check if project exists and user owns it
    const project = projects.find(
      (p) => p.id === projectId && p.user_id === userId
    );
    if (!project) {
      throw new Error('Project not found or access denied');
    }

    return (
      boardItems.find(
        (item) => item.id === itemId && item.project_id === projectId
      ) || null
    );
  },

  async update(
    itemId: string,
    projectId: string,
    userId: string,
    updateData: UpdateBoardItemRequest
  ): Promise<BoardItem | null> {
    // Check if project exists and user owns it
    const project = projects.find(
      (p) => p.id === projectId && p.user_id === userId
    );
    if (!project) {
      throw new Error('Project not found or access denied');
    }

    const itemIndex = boardItems.findIndex(
      (item) => item.id === itemId && item.project_id === projectId
    );
    if (itemIndex === -1) return null;

    boardItems[itemIndex] = {
      ...boardItems[itemIndex],
      ...updateData,
      updated_at: new Date().toISOString(),
    };
    return boardItems[itemIndex];
  },

  async delete(
    itemId: string,
    projectId: string,
    userId: string
  ): Promise<boolean> {
    // Check if project exists and user owns it
    const project = projects.find(
      (p) => p.id === projectId && p.user_id === userId
    );
    if (!project) {
      throw new Error('Project not found or access denied');
    }

    const itemIndex = boardItems.findIndex(
      (item) => item.id === itemId && item.project_id === projectId
    );
    if (itemIndex === -1) return false;

    boardItems.splice(itemIndex, 1);
    return true;
  },

  async bulkUpdate(
    projectId: string,
    userId: string,
    bulkData: BulkUpdateRequest
  ): Promise<{ updated: number }> {
    // Check if project exists and user owns it
    const project = projects.find(
      (p) => p.id === projectId && p.user_id === userId
    );
    if (!project) {
      throw new Error('Project not found or access denied');
    }

    let updated = 0;
    for (const itemId of bulkData.itemIds) {
      const itemIndex = boardItems.findIndex(
        (item) => item.id === itemId && item.project_id === projectId
      );
      if (itemIndex !== -1) {
        boardItems[itemIndex] = {
          ...boardItems[itemIndex],
          ...bulkData.updates,
          updated_at: new Date().toISOString(),
        };
        updated++;
      }
    }

    return { updated };
  },

  async bulkDelete(
    projectId: string,
    userId: string,
    bulkData: BulkDeleteRequest
  ): Promise<{ deleted: number }> {
    // Check if project exists and user owns it
    const project = projects.find(
      (p) => p.id === projectId && p.user_id === userId
    );
    if (!project) {
      throw new Error('Project not found or access denied');
    }

    let deleted = 0;
    for (const itemId of bulkData.itemIds) {
      const itemIndex = boardItems.findIndex(
        (item) => item.id === itemId && item.project_id === projectId
      );
      if (itemIndex !== -1) {
        boardItems.splice(itemIndex, 1);
        deleted++;
      }
    }

    return { deleted };
  },

  async getProjectStats(projectId: string, userId: string) {
    // Check if project exists and user owns it
    const project = projects.find(
      (p) => p.id === projectId && p.user_id === userId
    );
    if (!project) {
      throw new Error('Project not found or access denied');
    }

    const items = boardItems.filter((item) => item.project_id === projectId);

    return {
      total: items.length,
      bugs: items.filter((item) => item.type === 'bug').length,
      ideas: items.filter((item) => item.type === 'idea').length,
      byPriority: {
        now: items.filter((item) => item.priority === 'now').length,
        later: items.filter((item) => item.priority === 'later').length,
      },
    };
  },

  async findByUserId(
    userId: string,
    query: BoardItemListQuery = {}
  ): Promise<{ items: BoardItem[]; total: number }> {
    // Get all projects that belong to the user
    const userProjects = projects.filter((p) => p.user_id === userId);
    const projectIds = userProjects.map((p) => p.id);

    if (projectIds.length === 0) {
      return { items: [], total: 0 };
    }

    let items = boardItems.filter((item) =>
      projectIds.includes(item.project_id)
    );

    // Apply filters
    if (query.search) {
      items = items.filter(
        (item) =>
          item.title.toLowerCase().includes(query.search!.toLowerCase()) ||
          (item.description &&
            item.description
              .toLowerCase()
              .includes(query.search!.toLowerCase()))
      );
    }

    if (query.type) {
      items = items.filter((item) => item.type === query.type);
    }

    if (query.priority) {
      items = items.filter((item) => item.priority === query.priority);
    }

    // Apply sorting
    const sort = query.sort || 'created_at';
    const order = query.order || 'desc';
    items.sort((a, b) => {
      const aVal = a[sort as keyof BoardItem] as string;
      const bVal = b[sort as keyof BoardItem] as string;
      if (order === 'asc') {
        return (aVal || '') < (bVal || '')
          ? -1
          : (aVal || '') > (bVal || '')
            ? 1
            : 0;
      } else {
        return (aVal || '') > (bVal || '')
          ? -1
          : (aVal || '') < (bVal || '')
            ? 1
            : 0;
      }
    });

    // Apply pagination
    const page = query.page || 1;
    const limit = query.limit || 50;
    const offset = (page - 1) * limit;

    return {
      items: items.slice(offset, offset + limit),
      total: items.length,
    };
  },
};

// Test data management
export const TestDataManager = {
  seed() {
    // Seed test users
    users = [
      {
        id: 'test-user-1',
        email: 'test@example.com',
        name: 'Test User',
        google_id: '123456789',
      },
    ];

    // Seed test projects
    projects = [
      {
        id: 'test-project-1',
        user_id: 'test-user-1',
        name: 'Test Project 1',
        url: 'https://example.com',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'test-project-2',
        user_id: 'test-user-1',
        name: 'Test Project 2',
        url: 'https://example2.com',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    // Seed test board items
    boardItems = [
      {
        id: 'test-item-1',
        project_id: 'test-project-1',
        title: 'Test Bug 1',
        description: 'Test bug description',
        type: 'bug',
        priority: 'now',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'test-item-2',
        project_id: 'test-project-1',
        title: 'Test Idea 1',
        description: 'Test idea description',
        type: 'idea',
        priority: 'later',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    return {
      users,
      projects,
      boardItems,
    };
  },

  clear() {
    users = [];
    projects = [];
    boardItems = [];
  },

  getUsers() {
    return users;
  },
  getProjects() {
    return projects;
  },
  getBoardItems() {
    return boardItems;
  },
};
