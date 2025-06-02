-- Database Performance Optimization Script
-- Run this script to add indexes for better query performance

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Projects table indexes
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at);
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at);
CREATE INDEX IF NOT EXISTS idx_projects_user_created ON projects(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_projects_goatcounter_site_code ON projects(goatcounter_site_code);

-- Board items table indexes
CREATE INDEX IF NOT EXISTS idx_board_items_project_id ON board_items(project_id);
CREATE INDEX IF NOT EXISTS idx_board_items_type ON board_items(type);
CREATE INDEX IF NOT EXISTS idx_board_items_status ON board_items(status);
CREATE INDEX IF NOT EXISTS idx_board_items_priority ON board_items(priority);
CREATE INDEX IF NOT EXISTS idx_board_items_created_at ON board_items(created_at);
CREATE INDEX IF NOT EXISTS idx_board_items_updated_at ON board_items(updated_at);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_board_items_project_status ON board_items(project_id, status);
CREATE INDEX IF NOT EXISTS idx_board_items_project_type ON board_items(project_id, type);
CREATE INDEX IF NOT EXISTS idx_board_items_project_priority ON board_items(project_id, priority);
CREATE INDEX IF NOT EXISTS idx_board_items_project_created ON board_items(project_id, created_at);
CREATE INDEX IF NOT EXISTS idx_board_items_status_priority ON board_items(status, priority);

-- Full-text search indexes (if supported by your database)
-- Note: These may need to be adjusted based on your specific database system
-- CREATE INDEX IF NOT EXISTS idx_board_items_title_search ON board_items USING gin(to_tsvector('english', title));
-- CREATE INDEX IF NOT EXISTS idx_board_items_description_search ON board_items USING gin(to_tsvector('english', description));

-- Analyze tables to update statistics (PostgreSQL specific)
-- ANALYZE users;
-- ANALYZE projects;
-- ANALYZE board_items; 