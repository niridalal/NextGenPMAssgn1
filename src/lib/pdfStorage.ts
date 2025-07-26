import { supabase } from './supabase';
import { Flashcard, QuizQuestion, PDFProgress } from '../types';

export interface StoredPDFDocument {
  id: string;
  user_id: string;
  filename: string;
  content: string;
  page_count: number;
  created_at: string;
  updated_at: string;
}

export interface StoredPDFProgress {
  id: string;
  user_id: string;
  pdf_document_id: string;
  flashcards_total: number;
  flashcards_completed: number;
  flashcards_viewed: string[];
  quiz_total: number;
  quiz_completed: number;
  quiz_answered: string[];
  current_flashcard_index: number;
  current_quiz_index: number;
  last_accessed: string;
  created_at: string;
  updated_at: string;
}

// Save PDF document and learning materials to Supabase
export const savePDFToSupabase = async (
  filename: string,
  content: string,
  pageCount: number,
  flashcards: Flashcard[],
  quizQuestions: QuizQuestion[]
): Promise<string | null> => {
  try {
    console.log('💾 Saving PDF to Supabase:', filename);
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('❌ User not authenticated:', userError);
      return null;
    }

    // Save PDF document
    const { data: pdfDoc, error: pdfError } = await supabase
      .from('pdf_documents')
      .insert({
        user_id: user.id,
        filename,
        content,
        page_count: pageCount
      })
      .select()
      .single();

    if (pdfError || !pdfDoc) {
      console.error('❌ Error saving PDF document:', pdfError);
      return null;
    }

    console.log('✅ PDF document saved with ID:', pdfDoc.id);

    // Save flashcards
    if (flashcards.length > 0) {
      const flashcardData = flashcards.map((card, index) => ({
        pdf_document_id: pdfDoc.id,
        question: card.question,
        answer: card.answer,
        category: card.category,
        order_index: index
      }));

      const { error: flashcardError } = await supabase
        .from('flashcards')
        .insert(flashcardData);

      if (flashcardError) {
        console.error('❌ Error saving flashcards:', flashcardError);
        return null;
      }

      console.log('✅ Saved', flashcards.length, 'flashcards');
    }

    // Save quiz questions
    if (quizQuestions.length > 0) {
      const quizData = quizQuestions.map((question, index) => ({
        pdf_document_id: pdfDoc.id,
        question: question.question,
        options: question.options,
        correct_answer: question.correctAnswer,
        explanation: question.explanation,
        order_index: index
      }));

      const { error: quizError } = await supabase
        .from('quiz_questions')
        .insert(quizData);

      if (quizError) {
        console.error('❌ Error saving quiz questions:', quizError);
        return null;
      }

      console.log('✅ Saved', quizQuestions.length, 'quiz questions');
    }

    // Create initial progress record
    const { error: progressError } = await supabase
      .from('pdf_progress')
      .insert({
        user_id: user.id,
        pdf_document_id: pdfDoc.id,
        flashcards_total: flashcards.length,
        quiz_total: quizQuestions.length
      });

    if (progressError) {
      console.error('❌ Error creating progress record:', progressError);
      return null;
    }

    console.log('✅ PDF and learning materials saved successfully');
    return pdfDoc.id;

  } catch (error) {
    console.error('❌ Error saving PDF to Supabase:', error);
    return null;
  }
};

// Load all PDF documents with progress for current user
export const loadUserPDFs = async (): Promise<PDFProgress[]> => {
  try {
    console.log('📚 Loading user PDFs from Supabase...');
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('❌ User not authenticated:', userError);
      return [];
    }

    // Load PDF documents with progress
    const { data: pdfsWithProgress, error: loadError } = await supabase
      .from('pdf_documents')
      .select(`
        *,
        pdf_progress (*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (loadError) {
      console.error('❌ Error loading PDFs:', loadError);
      return [];
    }

    if (!pdfsWithProgress || pdfsWithProgress.length === 0) {
      console.log('📝 No PDFs found for user');
      return [];
    }

    // Convert to PDFProgress format
    const progressData: PDFProgress[] = [];

    for (const pdfDoc of pdfsWithProgress) {
      const progress = pdfDoc.pdf_progress?.[0]; // Should be only one progress per PDF
      
      // Load flashcards and quiz questions
      const [flashcardsResult, quizResult] = await Promise.all([
        supabase
          .from('flashcards')
          .select('*')
          .eq('pdf_document_id', pdfDoc.id)
          .order('order_index'),
        supabase
          .from('quiz_questions')
          .select('*')
          .eq('pdf_document_id', pdfDoc.id)
          .order('order_index')
      ]);

      const flashcards: Flashcard[] = flashcardsResult.data?.map(fc => ({
        id: fc.id,
        question: fc.question,
        answer: fc.answer,
        category: fc.category
      })) || [];

      const quizQuestions: QuizQuestion[] = quizResult.data?.map(q => ({
        id: q.id,
        question: q.question,
        options: q.options,
        correctAnswer: q.correct_answer,
        explanation: q.explanation
      })) || [];

      progressData.push({
        id: pdfDoc.id,
        filename: pdfDoc.filename,
        content: pdfDoc.content,
        flashcardsTotal: progress?.flashcards_total || flashcards.length,
        flashcardsCompleted: progress?.flashcards_completed || 0,
        flashcardsViewed: new Set(progress?.flashcards_viewed || []),
        quizTotal: progress?.quiz_total || quizQuestions.length,
        quizCompleted: progress?.quiz_completed || 0,
        quizAnswered: new Set(progress?.quiz_answered || []),
        currentFlashcardIndex: progress?.current_flashcard_index || 0,
        currentQuizIndex: progress?.current_quiz_index || 0,
        lastAccessed: progress?.last_accessed || pdfDoc.created_at,
        createdAt: pdfDoc.created_at,
        flashcards,
        quizQuestions
      });
    }

    console.log('✅ Loaded', progressData.length, 'PDFs with progress');
    return progressData;

  } catch (error) {
    console.error('❌ Error loading user PDFs:', error);
    return [];
  }
};

// Update progress for a specific PDF
export const updatePDFProgress = async (
  pdfDocumentId: string,
  updates: {
    flashcardsCompleted?: number;
    flashcardsViewed?: Set<string>;
    quizCompleted?: number;
    quizAnswered?: Set<string>;
    currentFlashcardIndex?: number;
    currentQuizIndex?: number;
  }
): Promise<boolean> => {
  try {
    console.log('📊 Updating PDF progress for:', pdfDocumentId);
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('❌ User not authenticated:', userError);
      return false;
    }

    // Prepare update data
    const updateData: any = {
      last_accessed: new Date().toISOString()
    };

    if (updates.flashcardsCompleted !== undefined) {
      updateData.flashcards_completed = updates.flashcardsCompleted;
    }
    if (updates.flashcardsViewed !== undefined) {
      updateData.flashcards_viewed = Array.from(updates.flashcardsViewed);
    }
    if (updates.quizCompleted !== undefined) {
      updateData.quiz_completed = updates.quizCompleted;
    }
    if (updates.quizAnswered !== undefined) {
      updateData.quiz_answered = Array.from(updates.quizAnswered);
    }
    if (updates.currentFlashcardIndex !== undefined) {
      updateData.current_flashcard_index = updates.currentFlashcardIndex;
    }
    if (updates.currentQuizIndex !== undefined) {
      updateData.current_quiz_index = updates.currentQuizIndex;
    }

    // Update progress
    const { error: updateError } = await supabase
      .from('pdf_progress')
      .update(updateData)
      .eq('user_id', user.id)
      .eq('pdf_document_id', pdfDocumentId);

    if (updateError) {
      console.error('❌ Error updating progress:', updateError);
      return false;
    }

    console.log('✅ Progress updated successfully');
    return true;

  } catch (error) {
    console.error('❌ Error updating PDF progress:', error);
    return false;
  }
};

// Delete PDF and all associated data
export const deletePDFFromSupabase = async (pdfDocumentId: string): Promise<boolean> => {
  try {
    console.log('🗑️ Deleting PDF from Supabase:', pdfDocumentId);
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('❌ User not authenticated:', userError);
      return false;
    }

    // Delete PDF document (cascading deletes will handle related data)
    const { error: deleteError } = await supabase
      .from('pdf_documents')
      .delete()
      .eq('id', pdfDocumentId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('❌ Error deleting PDF:', deleteError);
      return false;
    }

    console.log('✅ PDF deleted successfully');
    return true;

  } catch (error) {
    console.error('❌ Error deleting PDF:', error);
    return false;
  }
};

// Migrate existing localStorage data to Supabase
export const migrateLocalStorageToSupabase = async (): Promise<boolean> => {
  try {
    console.log('🔄 Migrating localStorage data to Supabase...');
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('❌ User not authenticated:', userError);
      return false;
    }

    // Check for existing localStorage data
    const localStorageKey = `pdf_progress_${user.id}`;
    const localData = localStorage.getItem(localStorageKey);
    
    if (!localData) {
      console.log('📝 No localStorage data to migrate');
      return true;
    }

    const parsedData = JSON.parse(localData);
    if (!Array.isArray(parsedData) || parsedData.length === 0) {
      console.log('📝 No valid localStorage data to migrate');
      return true;
    }

    console.log('📦 Found', parsedData.length, 'PDFs in localStorage');

    // Migrate each PDF
    for (const item of parsedData) {
      if (item.flashcards && item.quizQuestions) {
        const pdfId = await savePDFToSupabase(
          item.filename,
          item.content,
          1, // Default page count
          item.flashcards,
          item.quizQuestions
        );

        if (pdfId) {
          // Update progress if there was any
          await updatePDFProgress(pdfId, {
            flashcardsCompleted: item.flashcardsCompleted || 0,
            flashcardsViewed: new Set(item.flashcardsViewed || []),
            quizCompleted: item.quizCompleted || 0,
            quizAnswered: new Set(item.quizAnswered || []),
            currentFlashcardIndex: item.currentFlashcardIndex || 0,
            currentQuizIndex: item.currentQuizIndex || 0
          });
        }
      }
    }

    // Clear localStorage after successful migration
    localStorage.removeItem(localStorageKey);
    console.log('✅ Migration completed successfully');
    return true;

  } catch (error) {
    console.error('❌ Error migrating localStorage data:', error);
    return false;
  }
};