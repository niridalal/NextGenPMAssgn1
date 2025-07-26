/*
  # PDF Storage and Progress Tracking

  1. New Tables
    - `pdf_documents`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `filename` (text)
      - `content` (text, extracted PDF content)
      - `page_count` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `pdf_progress`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `pdf_document_id` (uuid, foreign key to pdf_documents)
      - `flashcards_total` (integer)
      - `flashcards_completed` (integer)
      - `flashcards_viewed` (jsonb, array of viewed flashcard IDs)
      - `quiz_total` (integer)
      - `quiz_completed` (integer)
      - `quiz_answered` (jsonb, array of answered quiz IDs)
      - `current_flashcard_index` (integer)
      - `current_quiz_index` (integer)
      - `last_accessed` (timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `flashcards`
      - `id` (uuid, primary key)
      - `pdf_document_id` (uuid, foreign key to pdf_documents)
      - `question` (text)
      - `answer` (text)
      - `category` (text)
      - `order_index` (integer)
      - `created_at` (timestamp)
    
    - `quiz_questions`
      - `id` (uuid, primary key)
      - `pdf_document_id` (uuid, foreign key to pdf_documents)
      - `question` (text)
      - `options` (jsonb, array of options)
      - `correct_answer` (integer)
      - `explanation` (text)
      - `order_index` (integer)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- PDF Documents table
CREATE TABLE IF NOT EXISTS pdf_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  filename text NOT NULL,
  content text NOT NULL,
  page_count integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- PDF Progress table
CREATE TABLE IF NOT EXISTS pdf_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pdf_document_id uuid REFERENCES pdf_documents(id) ON DELETE CASCADE NOT NULL,
  flashcards_total integer DEFAULT 0,
  flashcards_completed integer DEFAULT 0,
  flashcards_viewed jsonb DEFAULT '[]'::jsonb,
  quiz_total integer DEFAULT 0,
  quiz_completed integer DEFAULT 0,
  quiz_answered jsonb DEFAULT '[]'::jsonb,
  current_flashcard_index integer DEFAULT 0,
  current_quiz_index integer DEFAULT 0,
  last_accessed timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, pdf_document_id)
);

-- Flashcards table
CREATE TABLE IF NOT EXISTS flashcards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pdf_document_id uuid REFERENCES pdf_documents(id) ON DELETE CASCADE NOT NULL,
  question text NOT NULL,
  answer text NOT NULL,
  category text DEFAULT 'Concept',
  order_index integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Quiz Questions table
CREATE TABLE IF NOT EXISTS quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pdf_document_id uuid REFERENCES pdf_documents(id) ON DELETE CASCADE NOT NULL,
  question text NOT NULL,
  options jsonb NOT NULL,
  correct_answer integer NOT NULL,
  explanation text NOT NULL,
  order_index integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE pdf_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;

-- Policies for pdf_documents
CREATE POLICY "Users can manage their own PDF documents"
  ON pdf_documents
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies for pdf_progress
CREATE POLICY "Users can manage their own PDF progress"
  ON pdf_progress
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies for flashcards
CREATE POLICY "Users can access flashcards for their PDFs"
  ON flashcards
  FOR ALL
  TO authenticated
  USING (
    pdf_document_id IN (
      SELECT id FROM pdf_documents WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    pdf_document_id IN (
      SELECT id FROM pdf_documents WHERE user_id = auth.uid()
    )
  );

-- Policies for quiz_questions
CREATE POLICY "Users can access quiz questions for their PDFs"
  ON quiz_questions
  FOR ALL
  TO authenticated
  USING (
    pdf_document_id IN (
      SELECT id FROM pdf_documents WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    pdf_document_id IN (
      SELECT id FROM pdf_documents WHERE user_id = auth.uid()
    )
  );

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pdf_documents_user_id ON pdf_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_pdf_progress_user_id ON pdf_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_pdf_progress_pdf_document_id ON pdf_progress(pdf_document_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_pdf_document_id ON flashcards(pdf_document_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_pdf_document_id ON quiz_questions(pdf_document_id);

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pdf_documents_updated_at
  BEFORE UPDATE ON pdf_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pdf_progress_updated_at
  BEFORE UPDATE ON pdf_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();