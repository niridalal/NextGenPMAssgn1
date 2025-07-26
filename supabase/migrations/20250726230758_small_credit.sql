/*
  # Create app settings table for OpenAI API key

  1. New Tables
    - `app_settings`
      - `id` (serial, primary key)
      - `key` (text, unique) - setting name
      - `value` (text) - setting value
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `app_settings` table
    - Add policy for authenticated users to read settings
    - Add policy for authenticated users to manage settings

  3. Initial Data
    - Placeholder for OPENAI_API_KEY (you'll need to update this)
*/

CREATE TABLE IF NOT EXISTS app_settings (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read settings
CREATE POLICY "Users can read app settings"
  ON app_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert/update settings
CREATE POLICY "Users can manage app settings"
  ON app_settings
  FOR ALL
  TO authenticated
  USING (true);

-- Insert placeholder for OpenAI API key
INSERT INTO app_settings (key, value) 
VALUES ('OPENAI_API_KEY', 'your-openai-api-key-here')
ON CONFLICT (key) DO NOTHING;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_app_settings_updated_at 
    BEFORE UPDATE ON app_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();