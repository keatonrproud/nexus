export interface BoardItem {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  type: 'bug' | 'idea';
  priority: 'now' | 'later';
  created_at: string;
  updated_at: string;
}

export interface CreateBoardItemRequest {
  title: string;
  description?: string | null;
  type: 'bug' | 'idea';
  priority?: 'now' | 'later';
}

export interface UpdateBoardItemRequest {
  title?: string;
  description?: string | null;
  type?: 'bug' | 'idea';
  priority?: 'now' | 'later';
}

export interface BoardItemResponse {
  success: boolean;
  item: BoardItem;
}

export interface BoardItemsListResponse {
  success: boolean;
  items: BoardItem[];
  total: number;
  page: number;
  limit: number;
}

// Query parameters for listing board items
export interface BoardItemListQuery {
  page?: number;
  limit?: number;
  search?: string;
  type?: 'bug' | 'idea';
  priority?: 'now' | 'later';
  sort?: 'title' | 'created_at' | 'updated_at' | 'priority';
  order?: 'asc' | 'desc';
}

// Bulk operations
export interface BulkUpdateRequest {
  itemIds: string[];
  updates: {
    priority?: 'now' | 'later';
  };
}

export interface BulkDeleteRequest {
  itemIds: string[];
}

export interface BulkOperationResponse {
  success: boolean;
  updated: number;
  message: string;
}

// Validation error types
export interface BoardItemValidationErrors {
  title?: string[];
  description?: string[];
  type?: string[];
  priority?: string[];
}
