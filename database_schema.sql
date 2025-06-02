-- Bug/Idea Board Database Schema
-- Created for Supabase PostgreSQL

-- MIGRATION: If you have an existing database, run this to add the new columns:
-- ALTER TABLE projects ADD COLUMN IF NOT EXISTS goatcounter_api_token VARCHAR(500);
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture_url VARCHAR(500);
-- ALTER TABLE projects ADD COLUMN IF NOT EXISTS emoji VARCHAR(10);

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    google_id VARCHAR(255) UNIQUE NOT NULL,
    profile_picture_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    url VARCHAR(500),
    emoji VARCHAR(10),
    goatcounter_site_code VARCHAR(255),
    goatcounter_api_token VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Board items table (for bugs and ideas)
CREATE TABLE board_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('bug', 'idea')),
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in-progress', 'closed')),
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_board_items_project_id ON board_items(project_id);
CREATE INDEX idx_board_items_type ON board_items(type);
CREATE INDEX idx_board_items_status ON board_items(status);
CREATE INDEX idx_board_items_priority ON board_items(priority);
CREATE INDEX idx_board_items_created_at ON board_items(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_board_items_updated_at BEFORE UPDATE ON board_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_items ENABLE ROW LEVEL SECURITY;

-- Note: No RLS policies are created as we will use the service key to bypass them
-- This allows the backend to handle all authorization logic

-- Insert some sample data for testing (optional)
-- Uncomment the following lines if you want sample data

-- Sample data for testing
INSERT INTO users (id, email, name, google_id, profile_picture_url) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'test@example.com', 'Test User', 'google_123', 'https://lh3.googleusercontent.com/a/default-user=s96-c');

INSERT INTO projects (id, user_id, name, url, goatcounter_site_code, goatcounter_api_token) VALUES
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'Test Project', 'https://example.com', 'example-site', 'test-api-token'); 