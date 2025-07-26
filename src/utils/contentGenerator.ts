import { Flashcard, QuizQuestion } from '../types';
import { getOpenAIClient } from '../lib/openai';

interface ContentAnalysisResult {
  flashcards: Flashcard[];
  quizQuestions: QuizQuestion[];
}

export const analyzeContentWithOpenAI = async (pdfContent: string): Promise<ContentAnalysisResult> => {
  console.log('🤖 Starting comprehensive PDF analysis...');
  console.log('📊 Content length:', pdfContent.length, 'characters');
  
  if (!pdfContent || pdfContent.trim().length < 300) {
    console.warn('PDF content too short for meaningful analysis');
    console.log('⚠️ Using LOCAL generation due to insufficient content');
    return generateLocalContent(pdfContent);
  }

  // Calculate number of items based on content length
  const contentLength = pdfContent.length;
  const flashcardCount = Math.min(Math.max(Math.floor(contentLength / 2000), 6), 20); // 6-20 flashcards
  const quizCount = Math.min(Math.max(Math.floor(contentLength / 3000), 4), 15); // 4-15 quiz questions
  
  console.log(`📊 Content-based generation: ${flashcardCount} flashcards, ${quizCount} quiz questions`);

  try {
    // Get OpenAI client from Supabase
    const openai = await getOpenAIClient();
    
    if (!openai) {
      console.warn('⚠️ OpenAI client not available, using local generation');
      console.log('💡 Make sure your OpenAI API key is properly configured in Supabase');
      console.log('🔄 FALLING BACK TO LOCAL GENERATION');
      return generateLocalContent(pdfContent);
    }
    
    console.log('🤖 OpenAI client ready for content generation');
    console.log('✨ USING OPENAI FOR CONTENT GENERATION');

    // Clean and prepare content for analysis
    const contentToAnalyze = cleanPDFContent(pdfContent).substring(0, 25000);
    
    if (contentToAnalyze.length < 300) {
      console.warn('Cleaned content too short for analysis');
      console.log('⚠️ Using LOCAL generation due to insufficient cleaned content');
      return generateLocalContent(pdfContent, flashcardCount, quizCount);
    }

    console.log(`📄 Analyzing ${contentToAnalyze.length} characters of content...`);

    // Step 1: Understand the document content
    const understandingPrompt = `Please carefully read and analyze this document content. I need you to understand the key concepts, main topics, important facts, and overall structure.

DOCUMENT CONTENT:
${contentToAnalyze}

Please provide:
1. Main subject/topic of the document
2. Key concepts and definitions
3. Important facts and information
4. Main themes or arguments
5. Any processes, procedures, or methodologies mentioned

Respond in clear, structured paragraphs.`;

    console.log('🔍 Step 1: Understanding document content...');
    
    const understandingResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an expert document analyst with perfect reading comprehension." },
        { role: "user", content: understandingPrompt }
      ],
      temperature: 0.3,
      max_tokens: 1500
    });

    const documentSummary = understandingResponse.choices[0]?.message?.content;
    if (!documentSummary) {
      throw new Error('Failed to understand document content');
    }

    console.log('✅ Document understanding complete');
    console.log('📋 Summary length:', documentSummary.length, 'characters');

    // Step 2: Generate educational content based on understanding
    const generationPrompt = `Based on your understanding of this document, create high-quality educational materials.

DOCUMENT SUMMARY:
${documentSummary}

ORIGINAL CONTENT (for reference):
${contentToAnalyze.substring(0, 10000)}

Create educational materials that are:
- Directly based on the document content
- Grammatically perfect
- Educationally valuable
- Clear and well-structured
- DISTINCT between flashcards and quiz questions (different question styles)

FLASHCARD REQUIREMENTS:
- Create exactly ${flashcardCount} flashcards
- Each flashcard must test specific knowledge from the document
- Questions must be complete, grammatically correct sentences
- Answers must be comprehensive (2-3 sentences minimum)
- Use FLASHCARD-STYLE questions: "What is...", "Define...", "Explain the concept of...", "Describe...", "What does... mean?"
- Categories: Definition, Concept, Process, Application, Analysis
- Focus on DEFINITIONS, EXPLANATIONS, and CONCEPTUAL understanding

QUIZ REQUIREMENTS:
- Create exactly ${quizCount} multiple choice questions
- Each question must test understanding of document content
- All 4 options must be plausible but only one correct
- Questions must be complete sentences
- Use QUIZ-STYLE questions: "According to the document...", "Which of the following...", "What happens when...", "The document states that...", "Based on the text..."
- Focus on FACTS, DETAILS, RELATIONSHIPS, and SPECIFIC INFORMATION
- Provide detailed explanations for correct answers
- Make questions DIFFERENT from flashcard questions (test different aspects)

CRITICAL: Respond with ONLY valid JSON in this exact format:

{
  "flashcards": [
    {
      "id": "fc-1",
      "question": "What is [concept] as described in the document?",
      "answer": "Comprehensive answer explaining the concept with context from the document. Additional details that help understanding.",
      "category": "Definition"
    }
  ],
  "quizQuestions": [
    {
      "id": "quiz-1", 
      "question": "According to the document, which of the following statements about [topic] is correct?",
      "options": ["Correct answer from document", "Plausible incorrect option", "Another incorrect option", "Third incorrect option"],
      "correctAnswer": 0,
      "explanation": "Detailed explanation of why this answer is correct based on the document content."
    }
  ]
}`;

    console.log('🎯 Step 2: Generating educational content...');

    const generationResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: "You are an expert educational content creator. Create perfect, grammatically correct educational materials based on document content. Always respond with valid JSON only." 
        },
        { role: "user", content: generationPrompt }
      ],
      temperature: 0.1, // Very low for consistency
      max_tokens: 4000
    });

    const generationContent = generationResponse.choices[0]?.message?.content;
    if (!generationContent) {
      throw new Error('No educational content generated');
    }

    console.log('✅ Educational content generated');
    console.log('📝 Response length:', generationContent.length, 'characters');

    // Parse and validate the JSON response
    const parsedContent = parseAndValidateResponse(generationContent);
    
    console.log('🎯 Content generation complete!');
    console.log(`📚 Generated ${parsedContent.flashcards.length} flashcards`);
    console.log(`❓ Generated ${parsedContent.quizQuestions.length} quiz questions`);

    return parsedContent;

  } catch (error) {
    console.error('❌ Error during OpenAI analysis:', error);
    console.log('🔄 FALLING BACK TO LOCAL GENERATION due to error');
    return generateLocalContent(pdfContent, flashcardCount, quizCount);
  }
};

// Clean PDF content for better analysis
const cleanPDFContent = (content: string): string => {
  return content
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    // Remove page numbers and headers/footers patterns
    .replace(/\b\d+\b\s*$/gm, '')
    // Remove common PDF artifacts
    .replace(/[^\w\s.,!?;:()\-"']/g, ' ')
    // Clean up multiple spaces
    .replace(/\s+/g, ' ')
    .trim();
};

// Parse and validate OpenAI response
const parseAndValidateResponse = (content: string): ContentAnalysisResult => {
  try {
    // Clean the response
    let cleanedContent = content.trim();
    
    // Remove markdown code blocks if present
    cleanedContent = cleanedContent.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // Extract JSON object
    const jsonStart = cleanedContent.indexOf('{');
    const jsonEnd = cleanedContent.lastIndexOf('}') + 1;
    
    if (jsonStart === -1 || jsonEnd === 0) {
      throw new Error('No valid JSON found in response');
    }
    
    const jsonString = cleanedContent.substring(jsonStart, jsonEnd);
    const parsedResponse = JSON.parse(jsonString);
    
    // Validate and clean flashcards
    const flashcards = (parsedResponse.flashcards || [])
      .filter(fc => 
        fc.question && 
        fc.answer && 
        fc.question.length > 15 && 
        fc.answer.length > 50 &&
        fc.question.includes('?') // Ensure it's a proper question
      )
      .map((fc, index) => ({
        id: `fc-${index + 1}`,
        question: fc.question.trim(),
        answer: fc.answer.trim(),
        category: fc.category || 'Concept'
      }));

    // Validate and clean quiz questions
    const quizQuestions = (parsedResponse.quizQuestions || [])
      .filter(q => 
        q.question && 
        q.options && 
        Array.isArray(q.options) && 
        q.options.length === 4 && 
        q.explanation &&
        typeof q.correctAnswer === 'number' &&
        q.correctAnswer >= 0 && 
        q.correctAnswer < 4 &&
        q.question.includes('?') && // Ensure it's a proper question
        q.question.length > 15 &&
        q.explanation.length > 30
      )
      .map((q, index) => ({
        id: `quiz-${index + 1}`,
        question: q.question.trim(),
        options: q.options.map(opt => opt.trim()),
        correctAnswer: q.correctAnswer,
        explanation: q.explanation.trim()
      }));

    console.log(`✅ Validation complete: ${flashcards.length} flashcards, ${quizQuestions.length} quiz questions`);

    if (flashcards.length === 0 && quizQuestions.length === 0) {
      throw new Error('No valid educational content after validation');
    }

    return { flashcards, quizQuestions };

  } catch (error) {
    console.error('❌ Error parsing OpenAI response:', error);
    throw new Error('Failed to parse educational content from OpenAI response');
  }
};

// Enhanced local content generation as fallback
const generateLocalContent = (content: string, flashcardCount: number = 8, quizCount: number = 6): ContentAnalysisResult => {
  console.log('🔧 GENERATING LOCAL CONTENT (NOT USING OPENAI)');
  console.log('📝 This means OpenAI was not used for this generation');
  console.log(`📊 Generating ${flashcardCount} flashcards and ${quizCount} quiz questions`);
  
  const cleanedContent = cleanPDFContent(content);
  const sentences = cleanedContent.split(/[.!?]+/).filter(s => s.trim().length > 30);
  const paragraphs = cleanedContent.split(/\n\s*\n/).filter(p => p.trim().length > 100);
  
  // Create more varied content pools
  const keyTerms = extractKeyTerms(cleanedContent);
  const importantSentences = sentences.filter(s => s.length > 80).slice(0, Math.max(flashcardCount, quizCount) * 2);
  
  const flashcards: Flashcard[] = [];
  const quizQuestions: QuizQuestion[] = [];
  
  // Generate flashcards from key content
  for (let i = 0; i < Math.min(flashcardCount, importantSentences.length); i++) {
    const sentence = importantSentences[i].trim();
    if (sentence.length > 50) {
      // Extract key terms and concepts
      const words = sentence.split(' ').filter(w => w.length > 4);
      const keyTerm = words[Math.floor(Math.random() * Math.min(3, words.length))];
      
      if (keyTerm) {
        const questionTypes = [
          `What is ${keyTerm.toLowerCase()} according to the document?`,
          `Define ${keyTerm.toLowerCase()} as mentioned in the text.`,
          `Explain the concept of ${keyTerm.toLowerCase()} from the document.`,
          `Describe what ${keyTerm.toLowerCase()} means in this context.`,
          `What does the document say about ${keyTerm.toLowerCase()}?`
        ];
        
        flashcards.push({
          id: `fc-${i + 1}`,
          question: questionTypes[i % questionTypes.length],
          answer: `${sentence}. This information is important for understanding the key concepts discussed in the document and provides essential context for the subject matter.`,
          category: ['Definition', 'Concept', 'Process', 'Application', 'Analysis'][i % 5]
        });
      }
    }
  }
  
  // Generate quiz questions from paragraphs
  for (let i = 0; i < Math.min(quizCount, paragraphs.length); i++) {
    const paragraph = paragraphs[i].trim();
    const sentences = paragraph.split(/[.!?]+/).filter(s => s.trim().length > 20);
    
    if (sentences.length > 0) {
      const mainSentence = sentences[0].trim();
      const words = mainSentence.split(' ');
      
      if (words.length > 8) {
        const keyPhrase = words.slice(0, 4).join(' ');
        
        const questionTypes = [
          `According to the document, what is stated about ${keyPhrase.toLowerCase()}?`,
          `Which of the following best describes ${keyPhrase.toLowerCase()}?`,
          `The document indicates that ${keyPhrase.toLowerCase()}:`,
          `Based on the text, ${keyPhrase.toLowerCase()} is characterized by:`,
          `What does the document reveal about ${keyPhrase.toLowerCase()}?`
        ];
        
        const distractors = [
          'It serves as a primary research methodology for data collection.',
          'It represents a theoretical framework for comprehensive analysis.',
          'It functions as a measurement tool for quantitative evaluation.',
          'It operates as a systematic approach to problem-solving.',
          'It provides a structured method for information processing.',
          'It establishes guidelines for procedural implementation.'
        ];
        
        quizQuestions.push({
          id: `quiz-${i + 1}`,
          question: questionTypes[i % questionTypes.length],
          options: [
            mainSentence.length > 80 ? mainSentence.substring(0, 80) + '...' : mainSentence,
            distractors[i % distractors.length],
            distractors[(i + 1) % distractors.length],
            distractors[(i + 2) % distractors.length]
          ],
          correctAnswer: 0,
          explanation: `The correct answer is directly stated in the document. This information provides important context for understanding the main concepts and themes presented in the material.`
        });
      }
    }
  }
  
  console.log(`📚 Generated ${flashcards.length} local flashcards`);
  console.log(`❓ Generated ${quizQuestions.length} local quiz questions`);
  
  return { flashcards, quizQuestions };
};

// Helper function to extract key terms from content
const extractKeyTerms = (content: string): string[] => {
  const words = content.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 5);
  
  const wordFreq = words.reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return Object.entries(wordFreq)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 20)
    .map(([word]) => word);
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