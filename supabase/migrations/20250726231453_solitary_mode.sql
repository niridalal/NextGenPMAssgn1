/*
  # Fix OpenAI API Key Setup

  1. Tables
    - Ensure `app_settings` table exists with proper structure
    - Insert OpenAI API key placeholder if not exists
  
  2. Security
    - Enable RLS on `app_settings` table
    - Add policies for authenticated users to manage settings
  
  3. Data
    - Insert placeholder for OpenAI API key that needs to be updated
*/

-- Create app_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS app_settings (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY IF NOT EXISTS "Users can read app settings"
  ON app_settings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS "Users can manage app settings"
  ON app_settings
  FOR ALL
  TO authenticated
  USING (true);

-- Insert OpenAI API key placeholder if it doesn't exist
INSERT INTO app_settings (key, value) 
VALUES ('OPENAI_API_KEY', 'your-openai-api-key-here')
ON CONFLICT (key) DO NOTHING;