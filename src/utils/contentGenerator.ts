import { Flashcard, QuizQuestion } from '../types';
import { openai } from '../lib/openai';

export const generateFlashcards = async (pdfContent: string): Promise<Flashcard[]> => {
  console.log('🤖 Generating flashcards with OpenAI...');
  
  // Check if OpenAI is available
  if (!openai) {
    console.log('OpenAI API key not provided, using local generation');
    return generateLocalFlashcards(pdfContent);
  }
  
  if (!pdfContent || pdfContent.trim().length < 100) {
    console.warn('PDF content too short for meaningful analysis');
    return [];
  }

  try {
    const prompt = `
You are an expert educational content creator. Analyze the following PDF content and create high-quality flashcards for effective learning.

CONTENT TO ANALYZE:
${pdfContent.substring(0, 8000)} // Limit content to avoid token limits

INSTRUCTIONS:
1. Create 12-15 flashcards that cover the most important concepts, definitions, and key information
2. Focus on content that would be valuable for someone studying this material
3. Make questions clear, specific, and educational
4. Provide comprehensive answers that explain the concept thoroughly
5. Include context and significance where relevant
6. Categorize each flashcard appropriately

REQUIRED JSON FORMAT:
{
  "flashcards": [
    {
      "id": "fc-1",
      "question": "Clear, specific question about the content",
      "answer": "Comprehensive answer with context and explanation",
      "category": "Definition/Concept/Process/Key Fact/Principle"
    }
  ]
}

Generate flashcards that would genuinely help someone learn and understand this material.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert educational content creator specializing in creating effective learning materials from academic and professional documents."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 3000
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON format in OpenAI response');
    }

    const parsedResponse = JSON.parse(jsonMatch[0]);
    const flashcards = parsedResponse.flashcards || [];

    console.log(`✅ Generated ${flashcards.length} AI-powered flashcards`);
    return flashcards;

  } catch (error) {
    console.error('❌ Error generating flashcards with OpenAI:', error);
    
    // Fallback to local generation if OpenAI fails
    console.log('🔄 Falling back to local generation...');
    return generateLocalFlashcards(pdfContent);
  }
};

export const generateQuizQuestions = async (pdfContent: string): Promise<QuizQuestion[]> => {
  console.log('🤖 Generating quiz questions with OpenAI...');
  
  // Check if OpenAI is available
  if (!openai) {
    console.log('OpenAI API key not provided, using local generation');
    return generateLocalQuizQuestions(pdfContent);
  }
  
  if (!pdfContent || pdfContent.trim().length < 100) {
    console.warn('PDF content too short for meaningful quiz generation');
    return [];
  }

  try {
    const prompt = `
You are an expert educational assessment creator. Analyze the following PDF content and create challenging, relevant multiple-choice quiz questions.

CONTENT TO ANALYZE:
${pdfContent.substring(0, 8000)} // Limit content to avoid token limits

INSTRUCTIONS:
1. Create 8-10 multiple-choice questions that test understanding of key concepts
2. Each question should have 4 plausible options with only one correct answer
3. Focus on testing comprehension, application, and analysis - not just memorization
4. Make distractors (wrong answers) realistic and challenging
5. Provide detailed explanations for why the correct answer is right
6. Base all questions directly on the provided content

REQUIRED JSON FORMAT:
{
  "questions": [
    {
      "id": "quiz-1",
      "question": "Clear, specific question testing understanding",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Detailed explanation of why this answer is correct and why others are wrong"
    }
  ]
}

Create questions that would effectively assess someone's understanding of this material.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert educational assessment creator specializing in creating effective quiz questions from academic and professional documents."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 3000
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON format in OpenAI response');
    }

    const parsedResponse = JSON.parse(jsonMatch[0]);
    const questions = parsedResponse.questions || [];

    console.log(`✅ Generated ${questions.length} AI-powered quiz questions`);
    return questions;

  } catch (error) {
    console.error('❌ Error generating quiz questions with OpenAI:', error);
    
    // Fallback to local generation if OpenAI fails
    console.log('🔄 Falling back to local generation...');
    return generateLocalQuizQuestions(pdfContent);
  }
};

export async function generateFlashcardsAndQuiz(text: string): Promise<{ flashcards: Flashcard[], quiz: QuizQuestion[] }> {
  try {
    // Split text into chunks if it's too long (OpenAI has token limits)
    const maxChunkSize = 8000; // Conservative limit

    const [flashcards, quiz] = await Promise.all([
      generateFlashcards(text),
      generateQuizQuestions(text)
    ]);

    return { flashcards, quiz };
  } catch (error) {
    console.error('Error generating content:', error);
    return generateLocalContent(text);
  }
}

function generateLocalContent(text: string): { flashcards: Flashcard[], quiz: QuizQuestion[] } {
  return {
    flashcards: generateLocalFlashcards(text),
    quiz: generateLocalQuizQuestions(text)
  };
}

// Fallback local generation functions (simplified versions)
const generateLocalFlashcards = (content: string): Flashcard[] => {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 50);
  const flashcards: Flashcard[] = [];
  
  // Simple pattern matching for definitions
  sentences.forEach((sentence, index) => {
    const definitionMatch = sentence.match(/([A-Z][a-zA-Z\s]{2,30})\s+is\s+([^,]{20,100})/);
    if (definitionMatch && flashcards.length < 10) {
      flashcards.push({
        id: `fc-${index}`,
        question: `What is ${definitionMatch[1].trim()}?`,
        answer: definitionMatch[2].trim(),
        category: 'Definition'
      });
    }
  });
  
  return flashcards;
};

const generateLocalQuizQuestions = (content: string): QuizQuestion[] => {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 50);
  const questions: QuizQuestion[] = [];
  
  // Simple pattern matching for quiz questions
  sentences.forEach((sentence, index) => {
    const definitionMatch = sentence.match(/([A-Z][a-zA-Z\s]{2,30})\s+is\s+([^,]{20,100})/);
    if (definitionMatch && questions.length < 5) {
      const term = definitionMatch[1].trim();
      const correctAnswer = definitionMatch[2].trim();
      
      questions.push({
        id: `quiz-${index}`,
        question: `What is ${term}?`,
        options: [
          correctAnswer,
          'A method for analyzing data',
          'A type of research approach',
          'A theoretical framework'
        ],
        correctAnswer: 0,
        explanation: `${term} is defined as ${correctAnswer} in the document.`
      });
    }
  });
  
  return questions;
};