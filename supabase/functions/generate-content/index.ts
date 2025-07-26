import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface RequestBody {
  pdfContent: string;
  filename: string;
  pageCount: number;
}

interface FlashcardData {
  question: string;
  answer: string;
  category: string;
}

interface QuizQuestionData {
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('Generate content function called');

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    console.log('Authorization header found');

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get the current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    console.log('User authenticated:', user.id);

    const { pdfContent, filename, pageCount }: RequestBody = await req.json();

    if (!pdfContent || !filename) {
      throw new Error('Missing required fields');
    }

    console.log('PDF data received:', { filename, contentLength: pdfContent.length, pageCount });

    // Truncate content to prevent resource exhaustion (8000 chars max)
    const maxChars = 8000;
    let processedContent = pdfContent;
    
    if (pdfContent.length > maxChars) {
      // Try to truncate at a sentence boundary
      const truncated = pdfContent.substring(0, maxChars);
      const lastSentenceEnd = Math.max(
        truncated.lastIndexOf('.'),
        truncated.lastIndexOf('!'),
        truncated.lastIndexOf('?')
      );
      
      if (lastSentenceEnd > maxChars * 0.7) {
        processedContent = truncated.substring(0, lastSentenceEnd + 1) + '\n\n[Content truncated for processing]';
      } else {
        processedContent = truncated + '\n\n[Content truncated for processing]';
      }
    }

    console.log('Content processed:', { 
      original: pdfContent.length, 
      processed: processedContent.length,
      wasTruncated: pdfContent.length > maxChars
    });

    // Calculate quantities based on content length and page count
    const flashcardCount = Math.min(Math.max(8, Math.floor(pageCount * 2) + Math.floor(processedContent.length / 500)), 20);
    const quizCount = Math.min(Math.max(6, Math.floor(pageCount * 1.5) + Math.floor(processedContent.length / 800)), 15);

    console.log('Target quantities:', { flashcardCount, quizCount });

    // Store PDF in database
    const { data: pdfData, error: pdfError } = await supabaseClient
      .from('pdfs')
      .insert({
        user_id: user.id,
        filename,
        content: processedContent,
        page_count: pageCount,
      })
      .select()
      .single();

    if (pdfError) {
      console.error('PDF storage error:', pdfError);
      throw new Error(`Failed to store PDF: ${pdfError.message}`);
    }

    console.log('PDF stored successfully:', pdfData.id);

    // Generate content using OpenAI
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log('Generating flashcards...');

    // Generate flashcards
    const flashcardsResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are an expert educational content creator. Create exactly ${flashcardCount} flashcards from the provided content.

IMPORTANT: Return ONLY a valid JSON array. No additional text, explanations, or formatting.

Each flashcard should have:
- question: A clear, specific question
- answer: A comprehensive answer
- category: A relevant category (Definition, Concept, Process, Fact, etc.)

Format:
[
  {"question": "What is...", "answer": "...", "category": "Definition"},
  {"question": "How does...", "answer": "...", "category": "Process"}
]`
          },
          {
            role: 'user',
            content: processedContent
          }
        ],
        max_tokens: 1500,
        temperature: 0.3,
      }),
    });

    let flashcards: FlashcardData[] = [];

    if (!flashcardsResponse.ok) {
      console.error('OpenAI flashcards error:', await flashcardsResponse.text());
    } else {
      const flashcardsData = await flashcardsResponse.json();
      try {
        let content = flashcardsData.choices[0].message.content.trim();
        
        // Remove markdown formatting if present
        content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        
        // Try to extract JSON array if wrapped in text
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          content = jsonMatch[0];
        }
        
        flashcards = JSON.parse(content);
        console.log('Generated flashcards:', flashcards.length);
      } catch (e) {
        console.error('Failed to parse flashcards:', e);
      }
    }

    // Create fallback flashcards if needed
    if (flashcards.length < Math.floor(flashcardCount * 0.5)) {
      console.log('Creating fallback flashcards');
      const sentences = processedContent.split(/[.!?]+/).filter(s => s.trim().length > 50);
      
      for (let i = 0; i < Math.min(flashcardCount, sentences.length); i++) {
        const sentence = sentences[i].trim();
        if (sentence.length > 20) {
          flashcards.push({
            question: `What does the document say about the following topic?`,
            answer: sentence,
            category: 'Content Review'
          });
        }
      }
    }

    console.log('Generating quiz questions...');

    // Generate quiz questions
    const quizResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are an expert educational content creator. Create exactly ${quizCount} multiple-choice quiz questions from the provided content.

IMPORTANT: Return ONLY a valid JSON array. No additional text, explanations, or formatting.

Each question should have:
- question: A clear question
- options: Array of 4 possible answers
- correct_answer: Index (0-3) of the correct answer
- explanation: Brief explanation of why the answer is correct

Format:
[
  {
    "question": "What is...",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": 0,
    "explanation": "The correct answer is A because..."
  }
]`
          },
          {
            role: 'user',
            content: processedContent
          }
        ],
        max_tokens: 2000,
        temperature: 0.3,
      }),
    });

    let quizQuestions: QuizQuestionData[] = [];

    if (!quizResponse.ok) {
      console.error('OpenAI quiz error:', await quizResponse.text());
    } else {
      const quizData = await quizResponse.json();
      try {
        let content = quizData.choices[0].message.content.trim();
        
        // Remove markdown formatting if present
        content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        
        // Try to extract JSON array if wrapped in text
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          content = jsonMatch[0];
        }
        
        quizQuestions = JSON.parse(content);
        console.log('Generated quiz questions:', quizQuestions.length);
      } catch (e) {
        console.error('Failed to parse quiz questions:', e);
      }
    }

    // Create fallback quiz questions if needed
    if (quizQuestions.length < Math.floor(quizCount * 0.5)) {
      console.log('Creating fallback quiz questions');
      
      for (let i = 0; i < Math.min(quizCount, 5); i++) {
        quizQuestions.push({
          question: `Based on the document content, which statement is most accurate?`,
          options: [
            "The document contains important information relevant to the topic",
            "The document is completely unrelated to any meaningful subject",
            "The document contradicts all established knowledge",
            "The document contains only irrelevant details"
          ],
          correct_answer: 0,
          explanation: "The first option correctly identifies that the document contains relevant information."
        });
      }
    }

    // Store flashcards in database
    if (flashcards.length > 0) {
      const flashcardInserts = flashcards.slice(0, flashcardCount).map(card => ({
        pdf_id: pdfData.id,
        user_id: user.id,
        question: card.question || 'Question not available',
        answer: card.answer || 'Answer not available',
        category: card.category || 'General',
      }));

      const { error: flashcardError } = await supabaseClient
        .from('flashcards')
        .insert(flashcardInserts);

      if (flashcardError) {
        console.error('Failed to store flashcards:', flashcardError);
      } else {
        console.log('Flashcards stored successfully');
      }
    }

    // Store quiz questions in database
    if (quizQuestions.length > 0) {
      const quizInserts = quizQuestions.slice(0, quizCount).map(question => ({
        pdf_id: pdfData.id,
        user_id: user.id,
        question: question.question || 'Question not available',
        options: question.options || ['Option A', 'Option B', 'Option C', 'Option D'],
        correct_answer: question.correct_answer || 0,
        explanation: question.explanation || 'Explanation not available',
      }));

      const { error: quizError } = await supabaseClient
        .from('quiz_questions')
        .insert(quizInserts);

      if (quizError) {
        console.error('Failed to store quiz questions:', quizError);
      } else {
        console.log('Quiz questions stored successfully');
      }
    }

    console.log('Returning response');

    return new Response(
      JSON.stringify({
        success: true,
        pdf_id: pdfData.id,
        flashcards: flashcards.slice(0, flashcardCount).map((card, index) => ({
          id: index + 1,
          question: card.question,
          answer: card.answer,
          category: card.category,
        })),
        quiz_questions: quizQuestions.slice(0, quizCount).map((question, index) => ({
          id: index + 1,
          question: question.question,
          options: question.options,
          correctAnswer: question.correct_answer,
          explanation: question.explanation,
        })),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in generate-content function:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message || 'An unexpected error occurred',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});