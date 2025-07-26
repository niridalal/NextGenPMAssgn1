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

export interface PDFProgress {
  id: string;
  filename: string;
  content: string;
  flashcardsTotal: number;
  flashcardsCompleted: number;
  flashcardsViewed: Set<string>;
  quizTotal: number;
  quizCompleted: number;
  quizAnswered: Set<string>;
  currentFlashcardIndex: number;
  currentQuizIndex: number;
  lastAccessed: string;
  createdAt: string;
  flashcards: Flashcard[];
  quizQuestions: QuizQuestion[];
}