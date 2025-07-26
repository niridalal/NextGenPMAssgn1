import { Flashcard, QuizQuestion } from '../types';
import { openai } from '../lib/openai';

interface ContentAnalysisResult {
  flashcards: Flashcard[];
  quizQuestions: QuizQuestion[];
}

export const analyzeContentWithOpenAI = async (pdfContent: string): Promise<ContentAnalysisResult> => {
  console.log('🤖 Starting comprehensive PDF analysis with OpenAI...');
  
  if (!pdfContent || pdfContent.trim().length < 100) {
    console.warn('PDF content too short for meaningful analysis');
    return { flashcards: [], quizQuestions: [] };
  }

  // Check if OpenAI is available
  if (!openai) {
    console.log('OpenAI API key not provided, using local generation');
    return generateLocalContent(pdfContent);
  }

  try {
    // Comprehensive content analysis prompt
    const analysisPrompt = `
You are an expert educational content creator and learning scientist. You have a PhD in Education and 15+ years of experience creating high-quality learning materials. Your specialty is analyzing documents and creating precise, grammatically perfect flashcards and quiz questions that directly relate to the source material.

DOCUMENT CONTENT TO ANALYZE:
${pdfContent.substring(0, 15000)}

CRITICAL REQUIREMENTS:
1. READ AND UNDERSTAND the document content completely before generating any materials
2. ONLY create flashcards and questions based on information EXPLICITLY stated in the document
3. Use PERFECT grammar, spelling, and sentence structure in all content
4. Ensure ALL content is directly relevant to the document's subject matter
5. NO generic or template-based content - everything must be document-specific

FLASHCARD CREATION RULES:
- Create exactly 10-12 flashcards
- Each flashcard MUST be based on specific information from the document
- Questions should be clear, specific, and grammatically perfect
- Answers should be comprehensive but concise (2-4 sentences maximum)
- Focus on: key definitions, important concepts, main processes, significant facts
- Categories: Definition, Concept, Process, Fact, Application

QUIZ QUESTION CREATION RULES:
- Create exactly 6-8 multiple choice questions
- Each question MUST test understanding of content from the document
- All 4 answer options must be plausible and related to the document's topic
- Only ONE answer should be correct based on the document
- Explanations should reference specific parts of the document

QUALITY STANDARDS:
- Perfect grammar and spelling in ALL content
- Clear, professional language
- No repetitive or similar questions
- Each item should add unique educational value
- Content must be directly traceable to the source document

OUTPUT FORMAT (JSON only):
{
  "flashcards": [
    {
      "id": "fc-X",
      "question": "Clear, specific question about document content",
      "answer": "Precise, grammatically correct answer based on document information.",
      "category": "Definition"
    }
  ],
  "quizQuestions": [
    {
      "id": "quiz-X",
      "question": "Clear question testing document comprehension",
      "options": ["Correct answer", "Plausible wrong answer", "Another wrong answer", "Third wrong answer"],
      "correctAnswer": 0,
      "explanation": "Clear explanation referencing the document content and why this answer is correct."
    }
  ]
}

Remember: Quality over quantity. Every item must be grammatically perfect and directly relevant to the document.
`;

    console.log('🔄 Sending analysis request to OpenAI...');
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a world-class educational content creator with perfect grammar and writing skills. You create only high-quality, document-specific learning materials. You never use generic templates or create irrelevant content. Every flashcard and quiz question you generate is grammatically perfect, educationally valuable, and directly based on the source document provided."
        },
        {
          role: "user",
          content: analysisPrompt
        }
      ],
      temperature: 0.1, // Very low temperature for consistent, high-quality output
      max_tokens: 3500 // Optimized for quality content
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response received from OpenAI');
    }

    console.log('✅ Received response from OpenAI');

    // Parse the JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Invalid JSON format in OpenAI response:', content);
      throw new Error('Invalid JSON format in OpenAI response');
    }

    const parsedResponse = JSON.parse(jsonMatch[0]);
    
    const flashcards = parsedResponse.flashcards || [];
    const quizQuestions = parsedResponse.quizQuestions || [];

    // Validate the generated content
    if (flashcards.length === 0 && quizQuestions.length === 0) {
      throw new Error('No valid content generated by OpenAI');
    }

    console.log(`✅ OpenAI Analysis Complete:`);
    console.log(`📚 Generated ${flashcards.length} high-quality flashcards`);
    console.log(`❓ Generated ${quizQuestions.length} comprehensive quiz questions`);

    return {
      flashcards: flashcards,
      quizQuestions: quizQuestions
    };

  } catch (error) {
    console.error('❌ Error during OpenAI analysis:', error);
    
    // Fallback to local generation if OpenAI fails
    console.log('🔄 Falling back to local content generation...');
    return generateLocalContent(pdfContent);
  }
};

// Fallback local generation for when OpenAI is not available
const generateLocalContent = (content: string): ContentAnalysisResult => {
  console.log('🔧 Generating content locally...');
  
  const flashcards = generateLocalFlashcards(content);
  const quizQuestions = generateLocalQuizQuestions(content);
  
  console.log(`📚 Generated ${flashcards.length} local flashcards`);
  console.log(`❓ Generated ${quizQuestions.length} local quiz questions`);
  
  return { flashcards, quizQuestions };
};

// Simplified local generation functions
const generateLocalFlashcards = (content: string): Flashcard[] => {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 50);
  const flashcards: Flashcard[] = [];
  
  // Extract key concepts and definitions
  sentences.forEach((sentence, index) => {
    if (flashcards.length >= 8) return;
    
    // Look for definition patterns
    const definitionMatch = sentence.match(/([A-Z][a-zA-Z\s]{2,30})\s+is\s+([^,]{20,100})/);
    if (definitionMatch) {
      flashcards.push({
        id: `fc-${index}`,
        question: `What is ${definitionMatch[1].trim()}?`,
        answer: `${definitionMatch[2].trim()}\n\nContext: This definition is important for understanding the key concepts discussed in the document.`,
        category: 'Definition'
      });
    }
    
    // Look for process descriptions
    const processMatch = sentence.match(/(process|method|approach|technique)\s+of\s+([^,]{10,50})/i);
    if (processMatch && !definitionMatch) {
      flashcards.push({
        id: `fc-${index}`,
        question: `Describe the ${processMatch[1].toLowerCase()} of ${processMatch[2].trim()}.`,
        answer: `${sentence.trim()}\n\nSignificance: Understanding this process is crucial for grasping the main concepts in the document.`,
        category: 'Process'
      });
    }
  });
  
  return flashcards;
};

const generateLocalQuizQuestions = (content: string): QuizQuestion[] => {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 50);
  const questions: QuizQuestion[] = [];
  
  sentences.forEach((sentence, index) => {
    if (questions.length >= 5) return;
    
    // Generate questions from definitions
    const definitionMatch = sentence.match(/([A-Z][a-zA-Z\s]{2,30})\s+is\s+([^,]{20,100})/);
    if (definitionMatch) {
      const term = definitionMatch[1].trim();
      const correctAnswer = definitionMatch[2].trim();
      
      questions.push({
        id: `quiz-${index}`,
        question: `According to the document, what is ${term}?`,
        options: [
          correctAnswer,
          'A method for analyzing complex data sets',
          'A theoretical framework for research',
          'A tool for measuring performance metrics'
        ],
        correctAnswer: 0,
        explanation: `The correct answer is "${correctAnswer}" as explicitly stated in the document. This definition is important for understanding the core concepts discussed in the material.`
      });
    }
  });
  
  return questions;
};

// Legacy functions for backward compatibility (now deprecated)
export const generateFlashcards = async (pdfContent: string): Promise<Flashcard[]> => {
  const result = await analyzeContentWithOpenAI(pdfContent);
  return result.flashcards;
};

export const generateQuizQuestions = async (pdfContent: string): Promise<QuizQuestion[]> => {
  const result = await analyzeContentWithOpenAI(pdfContent);
  return result.quizQuestions;
};