/*
  # PDF Learning App Database Schema

  1. New Tables
    - `pdfs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `filename` (text)
      - `content` (text)
      - `page_count` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `flashcards`
      - `id` (uuid, primary key)
      - `pdf_id` (uuid, references pdfs)
      - `user_id` (uuid, references auth.users)
      - `question` (text)
      - `answer` (text)
      - `category` (text)
      - `created_at` (timestamp)
    
    - `quiz_questions`
      - `id` (uuid, primary key)
      - `pdf_id` (uuid, references pdfs)
      - `user_id` (uuid, references auth.users)
      - `question` (text)
      - `options` (jsonb)
      - `correct_answer` (integer)
      - `explanation` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create PDFs table
CREATE TABLE IF NOT EXISTS pdfs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  filename text NOT NULL,
  content text NOT NULL,
  page_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create flashcards table
CREATE TABLE IF NOT EXISTS flashcards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pdf_id uuid REFERENCES pdfs(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  question text NOT NULL,
  answer text NOT NULL,
  category text DEFAULT 'General',
  created_at timestamptz DEFAULT now()
);

-- Create quiz questions table
CREATE TABLE IF NOT EXISTS quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pdf_id uuid REFERENCES pdfs(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  question text NOT NULL,
  options jsonb NOT NULL,
  correct_answer integer NOT NULL,
  explanation text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE pdfs ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;

-- Create policies for PDFs
CREATE POLICY "Users can read own PDFs"
  ON pdfs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own PDFs"
  ON pdfs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own PDFs"
  ON pdfs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own PDFs"
  ON pdfs
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for flashcards
CREATE POLICY "Users can read own flashcards"
  ON flashcards
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own flashcards"
  ON flashcards
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own flashcards"
  ON flashcards
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own flashcards"
  ON flashcards
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for quiz questions
CREATE POLICY "Users can read own quiz questions"
  ON quiz_questions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz questions"
  ON quiz_questions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quiz questions"
  ON quiz_questions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own quiz questions"
  ON quiz_questions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pdfs_user_id ON pdfs(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_pdf_id ON flashcards(pdf_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_user_id ON flashcards(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_pdf_id ON quiz_questions(pdf_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_user_id ON quiz_questions(user_id);

-- Create updated_at trigger for PDFs
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pdfs_updated_at
  BEFORE UPDATE ON pdfs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();