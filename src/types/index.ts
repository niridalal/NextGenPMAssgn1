export interface Flashcard {
  id: number;
  question: string;
  answer: string;
  category?: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface Quiz {
  id: number;
  title: string;
  questions: QuizQuestion[];
}

export interface PDFData {
  filename: string;
  text: string;
  pageCount: number;
}