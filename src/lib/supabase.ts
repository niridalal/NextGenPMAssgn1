import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      pdfs: {
        Row: {
          id: string;
          user_id: string;
          filename: string;
          content: string;
          page_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          filename: string;
          content: string;
          page_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          filename?: string;
          content?: string;
          page_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      flashcards: {
        Row: {
          id: string;
          pdf_id: string;
          user_id: string;
          question: string;
          answer: string;
          category: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          pdf_id: string;
          user_id: string;
          question: string;
          answer: string;
          category?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          pdf_id?: string;
          user_id?: string;
          question?: string;
          answer?: string;
          category?: string;
          created_at?: string;
        };
      };
      quiz_questions: {
        Row: {
          id: string;
          pdf_id: string;
          user_id: string;
          question: string;
          options: string[];
          correct_answer: number;
          explanation: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          pdf_id: string;
          user_id: string;
          question: string;
          options: string[];
          correct_answer: number;
          explanation?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          pdf_id?: string;
          user_id?: string;
          question?: string;
          options?: string[];
          correct_answer?: number;
          explanation?: string;
          created_at?: string;
        };
      };
    };
  };
};