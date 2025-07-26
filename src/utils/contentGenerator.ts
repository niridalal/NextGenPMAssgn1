import { Flashcard, QuizQuestion } from '../types';
import { openai } from '../lib/openai';

export const generateFlashcards = async (pdfContent: string): Promise<Flashcard[]> => {
  console.log('🤖 Generating flashcards with OpenAI...');
  
  if (!pdfContent || pdfContent.trim().length < 100) {
    console.warn('PDF content too short for meaningful analysis');
    return [];
  }

  // Check if OpenAI is available
  if (!openai) {
    console.log('OpenAI API key not provided, using local generation');
    return generateLocalFlashcards(pdfContent);
  }

  try {
    const prompt = `
You are an expert educational content creator with deep expertise in learning science and pedagogy. Your task is to analyze the provided PDF content and create highly effective flashcards that promote deep understanding and retention.

CONTENT TO ANALYZE:
${pdfContent.substring(0, 12000)}

INSTRUCTIONS:
1. ANALYZE the content deeply to identify the most important concepts, principles, definitions, processes, and relationships
2. CREATE 12-15 flashcards that cover different aspects of the material:
   - Key definitions with context and significance
   - Important concepts with explanations and examples
   - Critical processes with step-by-step breakdowns
   - Significant relationships and connections
   - Practical applications and implications
3. ENSURE each flashcard:
   - Tests meaningful understanding, not just memorization
   - Has a clear, specific question that guides learning
   - Provides a comprehensive answer with context
   - Explains WHY the information is important
   - Uses language appropriate for the subject matter
4. CATEGORIZE each flashcard based on content type:
   - "Definition" - Clear term definitions
   - "Concept" - Theoretical frameworks and ideas
   - "Process" - Step-by-step procedures
   - "Principle" - Rules, laws, or guidelines
   - "Application" - Practical uses and examples
   - "Analysis" - Critical thinking and evaluation

REQUIRED JSON FORMAT:
{
  "flashcards": [
    {
      "id": "fc-1",
      "question": "What is [specific term/concept] and why is it significant?",
      "answer": "Detailed explanation that includes: definition, context, significance, examples, and connections to other concepts",
      "category": "Definition"
    }
  ]
}

FOCUS ON QUALITY OVER QUANTITY. Each flashcard should be educational, meaningful, and directly derived from the provided content.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert educational content creator and learning scientist. You specialize in analyzing complex documents and creating highly effective learning materials that promote deep understanding, critical thinking, and long-term retention. You understand how to identify the most important information and present it in ways that facilitate meaningful learning."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 4000
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
  
  if (!pdfContent || pdfContent.trim().length < 100) {
    console.warn('PDF content too short for meaningful quiz generation');
    return [];
  }

  // Check if OpenAI is available
  if (!openai) {
    console.log('OpenAI API key not provided, using local generation');
    return generateLocalQuizQuestions(pdfContent);
  }

  try {
    const prompt = `
You are an expert educational assessment creator with deep knowledge of cognitive science and effective testing strategies. Your task is to analyze the provided PDF content and create high-quality multiple-choice quiz questions that assess genuine understanding.

CONTENT TO ANALYZE:
${pdfContent.substring(0, 12000)}

INSTRUCTIONS:
1. ANALYZE the content to identify testable knowledge that demonstrates understanding
2. CREATE 8-12 multiple-choice questions that:
   - Test comprehension, application, and analysis (not just recall)
   - Cover the most important concepts and information
   - Require genuine understanding to answer correctly
   - Are directly based on the provided content
3. FOR EACH QUESTION:
   - Write a clear, specific question stem
   - Create 4 plausible answer options
   - Make distractors (wrong answers) realistic but clearly incorrect
   - Ensure only one answer is definitively correct
   - Base all content directly on the source material
4. QUESTION TYPES to include:
   - Definition questions with nuanced distractors
   - Application questions that test practical understanding
   - Analysis questions that require connecting concepts
   - Comparison questions that test understanding of relationships
   - Cause-and-effect questions that test logical reasoning
5. PROVIDE comprehensive explanations that:
   - Explain why the correct answer is right
   - Reference specific content from the document
   - Clarify why other options are incorrect
   - Add educational value beyond just correction

REQUIRED JSON FORMAT:
{
  "questions": [
    {
      "id": "quiz-1",
      "question": "Based on the document, which statement best describes [concept/process/relationship]?",
      "options": ["Correct comprehensive answer", "Plausible but incorrect option", "Another realistic distractor", "Third believable wrong answer"],
      "correctAnswer": 0,
      "explanation": "The correct answer is [option] because [detailed explanation with document reference]. The other options are incorrect because: [brief explanation of why each distractor is wrong]."
    }
  ]
}

FOCUS ON CREATING QUESTIONS THAT GENUINELY TEST UNDERSTANDING AND PROMOTE LEARNING.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert educational assessment creator and cognitive scientist. You specialize in creating high-quality quiz questions that effectively measure understanding, promote learning, and provide meaningful feedback. You understand how to craft questions that test genuine comprehension rather than mere memorization."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 4000
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