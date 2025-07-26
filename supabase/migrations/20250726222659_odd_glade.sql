/*
  # Drop all existing tables

  This migration removes all existing tables to start fresh.
  
  1. Drop Tables
    - Drop pdfs table
    - Drop flashcards table  
    - Drop quiz_questions table
    - Drop any related functions and triggers
*/

-- Drop tables in correct order (child tables first)
DROP TABLE IF EXISTS flashcards CASCADE;
DROP TABLE IF EXISTS quiz_questions CASCADE;
DROP TABLE IF EXISTS pdfs CASCADE;

-- Drop any custom functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;