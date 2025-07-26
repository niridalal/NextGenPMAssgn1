import { Flashcard, QuizQuestion } from '../types';
import { openai } from '../lib/openai';

interface ContentAnalysisResult {
  flashcards: Flashcard[];
  quizQuestions: QuizQuestion[];
}

export const analyzeContentWithOpenAI = async (pdfContent: string): Promise<ContentAnalysisResult> => {
  console.log('🤖 Starting OpenAI content analysis...');
  
  if (!pdfContent || pdfContent.trim().length < 200) {
    console.warn('PDF content too short for meaningful analysis');
    return generateLocalContent(pdfContent);
  }

  // Check if OpenAI is available
  if (!openai) {
    console.log('OpenAI API key not provided, using local generation');
    return generateLocalContent(pdfContent);
  }

  try {
    // Take substantial content for analysis
    const contentToAnalyze = pdfContent.substring(0, 15000);
    console.log('📖 Analyzing', contentToAnalyze.length, 'characters of content');
    
    const systemPrompt = `You are an expert educational content creator with 20+ years of experience in curriculum design and assessment creation. You excel at creating high-quality, grammatically perfect learning materials that promote deep understanding.

Your task is to analyze document content and create educational materials that are:
- Grammatically perfect with no errors
- Directly based on the document content
- Educationally valuable and meaningful
- Clear and well-structured
- Focused on key concepts and important information`;

    const userPrompt = `Please carefully read and analyze this document content, then create high-quality educational materials.

DOCUMENT CONTENT:
${contentToAnalyze}

INSTRUCTIONS:
1. Read and understand the document thoroughly
2. Identify the most important concepts, facts, and ideas
3. Create flashcards that highlight key points from the document
4. Create quiz questions that test understanding of the document content

FLASHCARD REQUIREMENTS:
- Create 8-10 flashcards based on the document
- Each flashcard must test knowledge of specific content from the document
- Questions should be clear and grammatically correct
- Answers should be comprehensive (2-3 sentences) and accurate
- Focus on the most important information
- Use categories: Definition, Concept, Process, Application, Analysis

QUIZ REQUIREMENTS:
- Create 5-7 multiple choice questions
- Each question must be based on document content
- All options should be plausible but only one correct
- Provide detailed explanations for correct answers
- Questions should test comprehension and understanding

QUALITY STANDARDS:
- Perfect grammar and spelling throughout
- Professional, clear language
- No generic or template responses
- Each item must be unique and valuable
- Content must be directly from the document

Please respond with ONLY a valid JSON object in this exact format:

{
  "flashcards": [
    {
      "id": "fc-1",
      "question": "Clear, grammatically correct question about document content",
      "answer": "Comprehensive answer with context and explanation from the document.",
      "category": "Definition"
    }
  ],
  "quizQuestions": [
    {
      "id": "quiz-1",
      "question": "Clear multiple choice question about document content",
      "options": ["Correct answer", "Incorrect option 1", "Incorrect option 2", "Incorrect option 3"],
      "correctAnswer": 0,
      "explanation": "Detailed explanation of why this answer is correct based on the document."
    }
  ]
}`;

    console.log('🔄 Sending analysis request to OpenAI...');
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.1, // Very low for consistent, focused output
      max_tokens: 3500,
      presence_penalty: 0,
      frequency_penalty: 0
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response received from OpenAI');
    }

    console.log('✅ Received response from OpenAI');
    console.log('📝 Response length:', content.length, 'characters');

    // Clean and parse JSON response
    let cleanedContent = content.trim();
    
    // Remove any markdown code blocks
    cleanedContent = cleanedContent.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // Find JSON object
    const jsonStart = cleanedContent.indexOf('{');
    const jsonEnd = cleanedContent.lastIndexOf('}') + 1;
    
    if (jsonStart === -1 || jsonEnd === 0) {
      throw new Error('No valid JSON found in OpenAI response');
    }
    
    const jsonString = cleanedContent.substring(jsonStart, jsonEnd);
    
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      console.error('Attempted to parse:', jsonString.substring(0, 500));
      throw new Error('Failed to parse OpenAI response as JSON');
    }
    
    // Validate and clean the response
    const flashcards = (parsedResponse.flashcards || [])
      .filter(fc => fc.question && fc.answer && fc.question.length > 10 && fc.answer.length > 20)
      .map((fc, index) => ({
        id: `fc-${index + 1}`,
        question: fc.question.trim(),
        answer: fc.answer.trim(),
        category: fc.category || 'Concept'
      }));

    const quizQuestions = (parsedResponse.quizQuestions || [])
      .filter(q => 
        q.question && 
        q.options && 
        Array.isArray(q.options) && 
        q.options.length === 4 && 
        q.explanation &&
        typeof q.correctAnswer === 'number' &&
        q.correctAnswer >= 0 && 
        q.correctAnswer < 4
      )
      .map((q, index) => ({
        id: `quiz-${index + 1}`,
        question: q.question.trim(),
        options: q.options.map(opt => opt.trim()),
        correctAnswer: q.correctAnswer,
        explanation: q.explanation.trim()
      }));

    console.log(`✅ Content validation complete:`);
    console.log(`📚 Valid flashcards: ${flashcards.length}`);
    console.log(`❓ Valid quiz questions: ${quizQuestions.length}`);

    // Ensure we have some content
    if (flashcards.length === 0 && quizQuestions.length === 0) {
      throw new Error('No valid educational content generated');
    }

    console.log('🎯 OpenAI analysis complete - high quality content generated!');

    return {
      flashcards,
      quizQuestions
    };

  } catch (error) {
    console.error('❌ Error during OpenAI analysis:', error);
    console.log('🔄 Falling back to local content generation...');
    return generateLocalContent(pdfContent);
  }
};

// Fallback local generation
const generateLocalContent = (content: string): ContentAnalysisResult => {
  console.log('🔧 Generating content locally...');
  
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 50);
  const flashcards: Flashcard[] = [];
  const quizQuestions: QuizQuestion[] = [];
  
  // Generate flashcards from key sentences
  sentences.slice(0, 8).forEach((sentence, index) => {
    const trimmedSentence = sentence.trim();
    if (trimmedSentence.length > 30) {
      // Look for definition patterns
      const definitionMatch = trimmedSentence.match(/([A-Z][a-zA-Z\s]{2,30})\s+is\s+([^,]{20,100})/);
      if (definitionMatch) {
        flashcards.push({
          id: `fc-${index + 1}`,
          question: `What is ${definitionMatch[1].trim()}?`,
          answer: `${definitionMatch[2].trim()}. This concept is important for understanding the key ideas discussed in the document.`,
          category: 'Definition'
        });
      } else {
        // Create concept-based flashcard
        const words = trimmedSentence.split(' ');
        if (words.length > 10) {
          const concept = words.slice(0, 5).join(' ');
          flashcards.push({
            id: `fc-${index + 1}`,
            question: `Explain the concept related to ${concept.toLowerCase()}.`,
            answer: `${trimmedSentence}. This information provides important context for understanding the document's main themes.`,
            category: 'Concept'
          });
        }
      }
    }
  });
  
  // Generate quiz questions
  sentences.slice(0, 5).forEach((sentence, index) => {
    const trimmedSentence = sentence.trim();
    if (trimmedSentence.length > 40) {
      const words = trimmedSentence.split(' ');
      if (words.length > 8) {
        const keyPhrase = words.slice(0, 6).join(' ');
        quizQuestions.push({
          id: `quiz-${index + 1}`,
          question: `According to the document, what can be said about ${keyPhrase.toLowerCase()}?`,
          options: [
            trimmedSentence.substring(0, 80) + '...',
            'It represents a theoretical framework for analysis.',
            'It is primarily used for data collection purposes.',
            'It serves as a measurement tool for evaluation.'
          ],
          correctAnswer: 0,
          explanation: `The correct answer is based directly on the content from the document. This information is important for understanding the key concepts presented.`
        });
      }
    }
  });
  
  console.log(`📚 Generated ${flashcards.length} local flashcards`);
  console.log(`❓ Generated ${quizQuestions.length} local quiz questions`);
  
  return { flashcards, quizQuestions };
};

// Legacy functions for backward compatibility
export const generateFlashcards = async (pdfContent: string): Promise<Flashcard[]> => {
  const result = await analyzeContentWithOpenAI(pdfContent);
  return result.flashcards;
};

export const generateQuizQuestions = async (pdfContent: string): Promise<QuizQuestion[]> => {
  const result = await analyzeContentWithOpenAI(pdfContent);
  return result.quizQuestions;
};