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
You are an expert educational content creator and learning scientist with deep expertise in document analysis, pedagogy, and assessment design. Your task is to thoroughly analyze the provided PDF content and create comprehensive learning materials.

DOCUMENT CONTENT TO ANALYZE:
${pdfContent.substring(0, 15000)}

YOUR MISSION:
1. DEEPLY ANALYZE the document to understand its core concepts, key information, and learning objectives
2. IDENTIFY the most important knowledge that readers should retain and understand
3. CREATE high-quality flashcards that highlight key points and promote understanding
4. GENERATE quiz questions that effectively test comprehension of the document

PART 1 - FLASHCARD GENERATION:
Create 12-15 flashcards that highlight the most important points from the document:

FLASHCARD REQUIREMENTS:
- Focus on KEY CONCEPTS, DEFINITIONS, PROCESSES, and IMPORTANT FACTS from the document
- Each flashcard should test meaningful understanding, not trivial details
- Questions should be clear and specific to the document content
- Answers should be comprehensive with context and significance
- Include why the information is important or relevant
- Categorize appropriately: Definition, Concept, Process, Principle, Application, Analysis

PART 2 - QUIZ GENERATION:
Create 8-12 multiple-choice questions that test understanding of the document:

QUIZ REQUIREMENTS:
- Test COMPREHENSION and APPLICATION, not just memorization
- Questions must be directly based on the document content
- Create 4 plausible answer options for each question
- Only one answer should be definitively correct
- Wrong answers should be realistic but clearly incorrect based on the document
- Provide detailed explanations that reference the document content

CRITICAL INSTRUCTIONS:
- Base ALL content strictly on the provided document
- Ensure questions and answers are educationally valuable
- Focus on information that demonstrates true understanding
- Make content relevant to the document's subject matter and context
- Avoid generic or template-based questions

REQUIRED JSON FORMAT:
{
  "flashcards": [
    {
      "id": "fc-1",
      "question": "What is [specific concept from document] and why is it significant?",
      "answer": "Comprehensive answer with definition, context, significance, and examples from the document. Explain why this concept matters in the context of the document's subject matter.",
      "category": "Definition"
    }
  ],
  "quizQuestions": [
    {
      "id": "quiz-1", 
      "question": "According to the document, which statement best describes [concept/process from document]?",
      "options": ["Correct answer based on document", "Plausible but incorrect option", "Another realistic distractor", "Third believable wrong answer"],
      "correctAnswer": 0,
      "explanation": "The correct answer is [option] because the document specifically states [reference to document content]. This is important because [significance]. The other options are incorrect because [brief explanation of why each is wrong based on document content]."
    }
  ]
}

FOCUS ON QUALITY AND EDUCATIONAL VALUE. Every flashcard and quiz question should genuinely help someone learn and understand the document content better.
`;

    console.log('🔄 Sending analysis request to OpenAI...');
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert educational content creator, learning scientist, and document analyst. You specialize in analyzing complex documents and creating highly effective learning materials that promote deep understanding, critical thinking, and long-term retention. You excel at identifying the most important information in any document and transforming it into engaging, educational content that facilitates meaningful learning."
        },
        {
          role: "user",
          content: analysisPrompt
        }
      ],
      temperature: 0.2, // Lower temperature for more consistent, focused analysis
      max_tokens: 4500 // Increased for comprehensive content
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