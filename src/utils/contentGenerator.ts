import { Flashcard, QuizQuestion } from '../types';

export const generateFlashcards = (pdfContent: string): Flashcard[] => {
  console.log('🎯 Generating flashcards from PDF content...');
  
  if (!pdfContent || pdfContent.trim().length < 50) {
    console.warn('PDF content too short for flashcard generation');
    return [];
  }

  const flashcards: Flashcard[] = [];
  
  // Clean and prepare the text
  const cleanText = pdfContent
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s.,!?;:()\-"']/g, '')
    .trim();
  
  // Split into sentences
  const sentences = cleanText
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 20 && s.length < 300);
  
  console.log(`📝 Processing ${sentences.length} sentences`);
  
  // Extract key concepts and definitions
  let id = 1;
  
  for (const sentence of sentences) {
    // Look for definition patterns
    const definitionMatch = sentence.match(/^([A-Z][a-zA-Z\s]{2,50})\s+(?:is|are|means?|refers?\s+to)\s+(.+)$/i);
    if (definitionMatch && flashcards.length < 15) {
      const term = definitionMatch[1].trim();
      const definition = definitionMatch[2].trim();
      
      if (isValidTerm(term) && isValidDefinition(definition)) {
        flashcards.push({
          id: `fc-${id++}`,
          question: `What is ${term}?`,
          answer: definition,
          category: 'Definition'
        });
      }
    }
    
    // Look for important facts
    if (sentence.includes('important') || sentence.includes('significant') || sentence.includes('key')) {
      if (flashcards.length < 20) {
        flashcards.push({
          id: `fc-${id++}`,
          question: 'What is this important fact?',
          answer: sentence,
          category: 'Key Fact'
        });
      }
    }
    
    // Look for numerical facts
    const numberMatch = sentence.match(/(\d+(?:\.\d+)?(?:%|percent|million|billion|thousand))/);
    if (numberMatch && flashcards.length < 20) {
      flashcards.push({
        id: `fc-${id++}`,
        question: `What is the numerical value mentioned in this context?`,
        answer: `${numberMatch[1]} - ${sentence}`,
        category: 'Numerical Fact'
      });
    }
  }
  
  console.log(`✅ Generated ${flashcards.length} flashcards`);
  return flashcards;
};

export const generateQuizQuestions = (pdfContent: string): QuizQuestion[] => {
  console.log('🎯 Generating quiz questions from PDF content...');
  
  if (!pdfContent || pdfContent.trim().length < 50) {
    console.warn('PDF content too short for quiz generation');
    return [];
  }

  const questions: QuizQuestion[] = [];
  
  // Clean and prepare the text
  const cleanText = pdfContent
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s.,!?;:()\-"']/g, '')
    .trim();
  
  // Split into sentences
  const sentences = cleanText
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 20 && s.length < 300);
  
  console.log(`📝 Processing ${sentences.length} sentences for quiz questions`);
  
  let id = 1;
  
  for (const sentence of sentences) {
    if (questions.length >= 10) break;
    
    // Look for definition patterns for quiz questions
    const definitionMatch = sentence.match(/^([A-Z][a-zA-Z\s]{2,50})\s+(?:is|are|means?|refers?\s+to)\s+(.+)$/i);
    if (definitionMatch) {
      const term = definitionMatch[1].trim();
      const correctAnswer = definitionMatch[2].trim();
      
      if (isValidTerm(term) && isValidDefinition(correctAnswer)) {
        // Generate distractors
        const distractors = generateDistractors(correctAnswer, sentences);
        const options = [correctAnswer, ...distractors].slice(0, 4);
        const shuffledOptions = shuffleArray(options);
        const correctIndex = shuffledOptions.indexOf(correctAnswer);
        
        questions.push({
          id: `quiz-${id++}`,
          question: `What is ${term}?`,
          options: shuffledOptions,
          correctAnswer: correctIndex,
          explanation: `${term} is defined as: ${correctAnswer}`
        });
      }
    }
    
    // Look for numerical questions
    const numberMatch = sentence.match(/(\d+(?:\.\d+)?(?:%|percent|million|billion|thousand))/);
    if (numberMatch && questions.length < 10) {
      const correctNumber = numberMatch[1];
      const context = sentence.replace(numberMatch[1], '___');
      
      // Generate numerical distractors
      const numericalDistractors = generateNumericalDistractors(correctNumber);
      const options = [correctNumber, ...numericalDistractors];
      const shuffledOptions = shuffleArray(options);
      const correctIndex = shuffledOptions.indexOf(correctNumber);
      
      questions.push({
        id: `quiz-${id++}`,
        question: `Fill in the blank: ${context}`,
        options: shuffledOptions,
        correctAnswer: correctIndex,
        explanation: `The correct answer is ${correctNumber}. Context: ${sentence}`
      });
    }
  }
  
  console.log(`✅ Generated ${questions.length} quiz questions`);
  return questions;
};

// Helper functions
const isValidTerm = (term: string): boolean => {
  return term.length >= 3 && 
         term.length <= 50 && 
         !/^(?:this|that|these|those|it|they|the|a|an)$/i.test(term) &&
         /[A-Za-z]/.test(term);
};

const isValidDefinition = (definition: string): boolean => {
  return definition.length >= 10 && 
         definition.length <= 200 &&
         !/^(?:this|that|these|those|it|they)$/i.test(definition.trim());
};

const generateDistractors = (correctAnswer: string, sentences: string[]): string[] => {
  const distractors: string[] = [];
  
  // Try to find other definitions from the text
  for (const sentence of sentences) {
    const match = sentence.match(/(?:is|are|means?|refers?\s+to)\s+(.+)$/i);
    if (match && match[1] !== correctAnswer && distractors.length < 3) {
      const distractor = match[1].trim();
      if (distractor.length > 10 && distractor.length < 150) {
        distractors.push(distractor);
      }
    }
  }
  
  // Fill with generic distractors if needed
  const genericDistractors = [
    'A systematic approach to problem solving',
    'A method for organizing information',
    'A framework for analysis and evaluation'
  ];
  
  while (distractors.length < 3) {
    const generic = genericDistractors[distractors.length];
    if (generic && !distractors.includes(generic)) {
      distractors.push(generic);
    } else {
      break;
    }
  }
  
  return distractors.slice(0, 3);
};

const generateNumericalDistractors = (correctAnswer: string): string[] => {
  const baseNumber = parseFloat(correctAnswer.replace(/[^\d.]/g, ''));
  const unit = correctAnswer.replace(/[\d.]/g, '');
  
  if (isNaN(baseNumber)) {
    return ['25', '50', '75'];
  }
  
  const variations = [
    Math.floor(baseNumber * 0.5) + unit,
    Math.floor(baseNumber * 1.5) + unit,
    Math.floor(baseNumber * 2) + unit
  ];
  
  return variations.slice(0, 3);
};

const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};