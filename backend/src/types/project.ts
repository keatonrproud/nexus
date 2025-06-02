export interface Project {
  id: string;
  user_id: string;
  name: string;
  url: string | null;
  emoji?: string | null;
  goatcounter_site_code?: string | null;
  goatcounter_api_token?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectRequest {
  name: string;
  url: string;
  emoji?: string | null;
  goatcounter_site_code?: string | null;
  goatcounter_api_token?: string | null;
}

export interface UpdateProjectRequest {
  name?: string;
  url?: string;
  emoji?: string | null;
  goatcounter_site_code?: string | null;
  goatcounter_api_token?: string | null;
}

export interface ProjectResponse {
  success: boolean;
  project: Project;
}

export interface ProjectsListResponse {
  success: boolean;
  projects: Project[];
  total: number;
}

export interface ProjectWithBoardItems extends Project {
  board_items: {
    id: string;
    title: string;
    description: string | null;
    type: 'bug' | 'idea';
    priority: 'now' | 'later';
    metadata: Record<string, any>;
    created_at: string;
    updated_at: string;
  }[];
}

export interface ProjectDetailResponse {
  success: boolean;
  project: ProjectWithBoardItems;
}

// Validation error types
export interface ValidationError {
  field: string;
  message: string;
}

export interface ProjectValidationErrors {
  name?: string[];
  url?: string[];
}

// Query parameters for listing projects
export interface ProjectListQuery {
  page?: number;
  limit?: number;
  search?: string;
  sort?: 'name' | 'created_at' | 'updated_at';
  order?: 'asc' | 'desc';
}

export interface ProjectFilters {
  search?: string;
  sort?: 'name' | 'created_at' | 'updated_at';
  order?: 'asc' | 'desc';
}

export interface ProjectStats {
  totalProjects: number;
  totalBugs: number;
  totalIdeas: number;
}
