import { Flashcard, QuizQuestion } from '../types';
import { openai } from '../lib/openai';

interface ContentAnalysisResult {
  flashcards: Flashcard[];
  quizQuestions: QuizQuestion[];
}

export const analyzeContentWithOpenAI = async (pdfContent: string): Promise<ContentAnalysisResult> => {
  console.log('🤖 Starting comprehensive PDF analysis with OpenAI...');
  
  if (!pdfContent || pdfContent.trim().length < 200) {
    console.warn('PDF content too short for meaningful analysis');
    return { flashcards: [], quizQuestions: [] };
  }

  // Check if OpenAI is available
  if (!openai) {
    console.log('OpenAI API key not provided, using local generation');
    return generateLocalContent(pdfContent);
  }

  try {
    console.log('📖 Analyzing document content thoroughly...');
    
    // Take more content for better analysis (up to 20,000 characters)
    const contentToAnalyze = pdfContent.substring(0, 20000);
    
    // Multi-step analysis prompt for better understanding
    const analysisPrompt = `
ROLE: You are a world-class educational content creator with expertise in learning science, curriculum design, and assessment creation. You have 20+ years of experience creating high-quality educational materials.

TASK: Carefully read and analyze the following document content. Take your time to understand the key concepts, main ideas, relationships, and important details before creating learning materials.

STEP 1: DOCUMENT ANALYSIS
First, thoroughly read and understand this document content:

${contentToAnalyze}

STEP 2: CONTENT UNDERSTANDING
Before creating any materials, identify:
- Main topics and themes
- Key concepts and definitions  
- Important processes or procedures
- Critical facts and data points
- Relationships between ideas
- Learning objectives that emerge from the content

STEP 3: CREATE EDUCATIONAL MATERIALS
Based on your thorough understanding of the document, create high-quality learning materials.

CRITICAL REQUIREMENTS:
1. ONLY use information explicitly found in the provided document
2. Every flashcard and quiz question must be directly traceable to specific content in the document
3. Use perfect grammar, spelling, and professional language
4. Create meaningful, educational content that promotes deep learning
5. Avoid generic or template-based responses
6. Focus on the most important and relevant information from the document

FLASHCARD CREATION RULES:
- Create 8-10 high-quality flashcards
- Each flashcard must test understanding of specific document content
- Questions should be clear, specific, and promote active recall
- Answers should be comprehensive yet concise (2-3 sentences)
- Include context or significance when relevant
- Categories: Definition, Concept, Process, Application, Analysis
- Prioritize the most important information from the document

QUIZ QUESTION CREATION RULES:
- Create 5-7 multiple choice questions
- Each question must test comprehension of document content
- All answer options should be plausible and related to the document topic
- Only one answer should be definitively correct based on the document
- Provide detailed explanations that reference the source material
- Test different levels of understanding (recall, comprehension, application)

QUALITY STANDARDS:
- Impeccable grammar and spelling throughout
- Professional, clear, and engaging language
- No repetitive content - each item should be unique
- Educational value - promote genuine learning and understanding
- Document-specific content only - no generic information
- Logical flow and appropriate difficulty level

REQUIRED OUTPUT FORMAT (JSON only, no additional text):
{
  "flashcards": [
    {
      "id": "fc-1",
      "question": "Specific question based on document content",
      "answer": "Comprehensive answer with context and significance when relevant.",
      "category": "Appropriate category"
    }
  ],
  "quizQuestions": [
    {
      "id": "quiz-1", 
      "question": "Question testing understanding of document content",
      "options": ["Correct answer from document", "Plausible incorrect option", "Another plausible incorrect option", "Third plausible incorrect option"],
      "correctAnswer": 0,
      "explanation": "Detailed explanation referencing specific document content and explaining why this answer is correct."
    }
  ]
}

REMEMBER: Take time to understand the document first. Quality over quantity. Every item must be educationally valuable and directly based on the provided content.
`;

    console.log('🔄 Sending comprehensive analysis request to OpenAI...');
    console.log('📊 Analyzing', contentToAnalyze.length, 'characters of content');
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert educational content creator and learning scientist. You excel at reading and understanding documents thoroughly, then creating high-quality, relevant learning materials. You always take time to understand content before creating materials. Your flashcards and quiz questions are always grammatically perfect, educationally sound, and directly based on the source material. You never create generic or irrelevant content."
        },
        {
          role: "user",
          content: analysisPrompt
        }
      ],
      temperature: 0.2, // Low temperature for focused, consistent output
      max_tokens: 4000, // Increased for more comprehensive content
      presence_penalty: 0.1, // Slight penalty to avoid repetition
      frequency_penalty: 0.1 // Slight penalty for varied language
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response received from OpenAI');
    }

    console.log('✅ Received comprehensive analysis from OpenAI');
    console.log('📝 Response length:', content.length, 'characters');

    // Parse the JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Invalid JSON format in OpenAI response:', content);
      throw new Error('Invalid JSON format in OpenAI response');
    }

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      console.error('Raw content:', content);
      throw new Error('Failed to parse OpenAI response as JSON');
    }
    
    const flashcards = parsedResponse.flashcards || [];
    const quizQuestions = parsedResponse.quizQuestions || [];

    // Validate content quality
    if (flashcards.length === 0 && quizQuestions.length === 0) {
      throw new Error('No valid educational content generated');
    }

    // Validate flashcard structure
    const validFlashcards = flashcards.filter(fc => 
      fc.question && fc.answer && fc.question.length > 10 && fc.answer.length > 20
    );

    // Validate quiz question structure  
    const validQuizQuestions = quizQuestions.filter(q =>
      q.question && q.options && q.options.length === 4 && q.explanation &&
      q.correctAnswer >= 0 && q.correctAnswer < 4
    );

    console.log(`✅ Content Quality Check:`);
    console.log(`📚 Valid flashcards: ${validFlashcards.length}/${flashcards.length}`);
    console.log(`❓ Valid quiz questions: ${validQuizQuestions.length}/${quizQuestions.length}`);

    // Validate the generated content
    if (validFlashcards.length === 0 && validQuizQuestions.length === 0) {
      throw new Error('No valid educational content passed quality checks');
    }

    console.log(`🎯 OpenAI Analysis Complete - High Quality Educational Content Generated!`);

    return {
      flashcards: validFlashcards,
      quizQuestions: validQuizQuestions
    };

  } catch (error) {
    console.error('❌ Error during comprehensive OpenAI analysis:', error);
    
    // Fallback to local generation if OpenAI fails
    console.log('🔄 Falling back to local content generation as backup...');
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