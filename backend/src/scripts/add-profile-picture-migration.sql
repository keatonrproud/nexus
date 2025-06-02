-- Migration: Add profile_picture_url to users table
-- Run this script in your Supabase SQL editor if you have an existing database

-- Add the profile_picture_url column to the users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture_url VARCHAR(500);

-- Add a comment to document the column
COMMENT ON COLUMN users.profile_picture_url IS 'URL to the user''s profile picture from Google OAuth';

-- Optional: Create an index for faster queries (if you plan to query by profile picture URL)
-- CREATE INDEX IF NOT EXISTS idx_users_profile_picture_url ON users(profile_picture_url);

-- Note: Existing users will have NULL profile_picture_url until they log in again
-- The next time they authenticate via Google OAuth, their profile picture will be stored 