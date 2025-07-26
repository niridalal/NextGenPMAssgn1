export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface PDFDocument {
  id: string;
  filename: string;
  content: string;
  pageCount: number;
  createdAt: string;
}