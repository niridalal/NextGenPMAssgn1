import React, { useState } from 'react';
import { BookOpen, CreditCard, Brain, FileText, Upload, TrendingUp } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import SignInPage from './components/SignInPage';
import UserMenu from './components/UserMenu';
import PDFUploader from './components/PDFUploader';
import FlashcardViewer from './components/FlashcardViewer';
import QuizInterface from './components/QuizInterface';
import ProgressTracker from './components/ProgressTracker';
import { Flashcard, QuizQuestion, PDFProgress } from './types';
import { extractTextFromPDF } from './utils/pdfProcessor';
import { analyzeContentWithOpenAI } from './utils/contentGenerator';
import { 
  savePDFToSupabase, 
  loadUserPDFs, 
  updatePDFProgress as updateSupabasePDFProgress, 
  deletePDFFromSupabase,
  migrateLocalStorageToSupabase 
} from './lib/pdfStorage';

type ActiveView = 'home' | 'flashcards' | 'quiz';
type HomeTab = 'upload' | 'progress';

function App() {
  const { user, loading } = useAuth();
  const [activeView, setActiveView] = useState<ActiveView>('home');
  const [activeHomeTab, setActiveHomeTab] = useState<HomeTab>('upload');
  const [pdfData, setPdfData] = useState<{ filename: string; content: string } | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentPDFProgress, setCurrentPDFProgress] = useState<PDFProgress | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [progressData, setProgressData] = useState<PDFProgress[]>([]);

  // Load progress data on component mount
  React.useEffect(() => {
    if (user) {
      initializeUserData();
    }
  }, [user]);

  const initializeUserData = async () => {
    try {
      console.log('🔄 Initializing user data...');
      
      // First, try to migrate any existing localStorage data
      await migrateLocalStorageToSupabase();
      
      // Then load data from Supabase
      const supabaseData = await loadUserPDFs();
      setProgressData(supabaseData);
      
      console.log('✅ User data initialized with', supabaseData.length, 'PDFs');
    } catch (error) {
      console.error('❌ Error initializing user data:', error);
    }
  };

  const updatePDFProgress = async (updatedProgress: PDFProgress) => {
    // Update local state immediately for responsive UI
    const newProgressData = progressData.map(item =>
      item.id === updatedProgress.id ? updatedProgress : item
    );
    setProgressData(newProgressData);
    setCurrentPDFProgress(updatedProgress);

    // Update Supabase in background
    await updateSupabasePDFProgress(updatedProgress.id, {
      flashcardsCompleted: updatedProgress.flashcardsCompleted,
      flashcardsViewed: updatedProgress.flashcardsViewed,
      quizCompleted: updatedProgress.quizCompleted,
      quizAnswered: updatedProgress.quizAnswered,
      currentFlashcardIndex: updatedProgress.currentFlashcardIndex,
      currentQuizIndex: updatedProgress.currentQuizIndex
    });
  };

  const deletePDFProgress = async (pdfId: string) => {
    try {
      // Delete from Supabase
      const success = await deletePDFFromSupabase(pdfId);
      
      if (success) {
        // Update local state
        const newProgressData = progressData.filter(item => item.id !== pdfId);
        setProgressData(newProgressData);
        
        if (currentPDFProgress?.id === pdfId) {
          setCurrentPDFProgress(null);
          setActiveView('home');
          setActiveHomeTab('upload');
        }
        
        console.log('✅ PDF deleted successfully');
      } else {
        console.error('❌ Failed to delete PDF');
      }
    } catch (error) {
      console.error('❌ Error deleting PDF:', error);
    }
  };

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show sign-in page if user is not authenticated
  if (!user) {
    return <SignInPage />;
  }

  const handleFileSelect = async (file: File) => {
    setIsProcessing(true);
    setError(null);
    setProcessingStep('Extracting text from PDF...');
    setProcessingProgress(10);
    
    try {
      console.log('📄 Processing PDF:', file.name);
      
      // Simulate progress for PDF extraction
      setTimeout(() => setProcessingProgress(25), 500);
      
      // Extract text from PDF
      const extractedData = await extractTextFromPDF(file);
      
      if (!extractedData.content || extractedData.content.trim().length === 0) {
        throw new Error('This PDF appears to contain no readable text. Please try a different PDF file.');
      }
      
      setProcessingStep('PDF text extracted successfully');
      setProcessingProgress(40);
      
      console.log('✅ PDF text extracted successfully');
      console.log('📊 Content length:', extractedData.content.length, 'characters');
      
      // Store PDF data
      setPdfData({
        filename: extractedData.filename,
        content: extractedData.content
      });
      
      setProcessingStep('Analyzing content with AI...');
      setProcessingProgress(60);
      
      // Analyze PDF content with OpenAI and generate learning materials
      console.log('🤖 Analyzing PDF content with OpenAI...');
      console.log('='.repeat(50));
      console.log('🚀 STARTING CONTENT GENERATION PROCESS');
      console.log('='.repeat(50));
      
      setTimeout(() => {
        setProcessingStep('Generating flashcards and quiz questions...');
        setProcessingProgress(80);
      }, 1000);
      
      const analysisResult = await analyzeContentWithOpenAI(extractedData.content);
      console.log('='.repeat(50));
      console.log('✅ CONTENT GENERATION PROCESS COMPLETE');
      console.log('='.repeat(50));
      
      setProcessingStep('Finalizing learning materials...');
      setProcessingProgress(95);
      
      setFlashcards(analysisResult.flashcards);
      setQuizQuestions(analysisResult.quizQuestions);
      
      setProcessingStep('Saving to database...');
      setProcessingProgress(98);
      
      // Save to Supabase
      const pdfId = await savePDFToSupabase(
        extractedData.filename,
        extractedData.content,
        extractedData.pageCount,
        analysisResult.flashcards,
        analysisResult.quizQuestions
      );
      
      if (pdfId) {
        // Create new progress entry
        const newProgress: PDFProgress = {
          id: pdfId,
          filename: extractedData.filename,
          content: extractedData.content,
          flashcardsTotal: analysisResult.flashcards.length,
          flashcardsCompleted: 0,
          flashcardsViewed: new Set(),
          quizTotal: analysisResult.quizQuestions.length,
          quizCompleted: 0,
          quizAnswered: new Set(),
          currentFlashcardIndex: 0,
          currentQuizIndex: 0,
          lastAccessed: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          flashcards: analysisResult.flashcards,
          quizQuestions: analysisResult.quizQuestions
        };
        
        const newProgressData = [...progressData, newProgress];
        setProgressData(newProgressData);
        setCurrentPDFProgress(newProgress);
        
        console.log('✅ PDF saved to Supabase with ID:', pdfId);
      } else {
        throw new Error('Failed to save PDF to database');
      }
      
      setProcessingStep('Complete!');
      setProcessingProgress(100);
      
      console.log('✅ Content generation complete');
      console.log('📚 Generated:', analysisResult.flashcards.length, 'flashcards');
      console.log('❓ Generated:', analysisResult.quizQuestions.length, 'quiz questions');
      
      // Small delay to show completion
      setTimeout(() => {
        setActiveView('flashcards');
      }, 500);
      
    } catch (err) {
      console.error('❌ Error processing PDF:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while processing the PDF');
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
        setProcessingStep('');
        setProcessingProgress(0);
      }, 500);
    }
  };

  const handleBackToUpload = () => {
    setActiveView('home');
    setActiveHomeTab('upload');
    // Don't clear data, just go back to home
    setError(null);
    setProcessingStep('');
    setProcessingProgress(0);
  };

  const handleSelectPDF = (pdfId: string) => {
    const selectedProgress = progressData.find(p => p.id === pdfId);
    if (selectedProgress) {
      setCurrentPDFProgress(selectedProgress);
      setPdfData({
        filename: selectedProgress.filename,
        content: selectedProgress.content
      });
      setFlashcards(selectedProgress.flashcards);
      setQuizQuestions(selectedProgress.quizQuestions);
      
      // Update last accessed time
      const updatedProgress = {
        ...selectedProgress,
        lastAccessed: new Date().toISOString()
      };
      updatePDFProgress(updatedProgress);
    }
    setActiveView('flashcards');
  };

  const handleFlashcardProgress = (currentIndex: number, viewedIds: Set<string>) => {
    if (currentPDFProgress) {
      const updatedProgress = {
        ...currentPDFProgress,
        currentFlashcardIndex: currentIndex,
        flashcardsViewed: viewedIds,
        flashcardsCompleted: viewedIds.size,
        lastAccessed: new Date().toISOString()
      };
      updatePDFProgress(updatedProgress);
    }
  };

  const handleQuizProgress = (currentIndex: number, answeredIds: Set<string>, answers: number[]) => {
    if (currentPDFProgress) {
      const updatedProgress = {
        ...currentPDFProgress,
        currentQuizIndex: currentIndex,
        quizAnswered: answeredIds,
        quizCompleted: answeredIds.size,
        lastAccessed: new Date().toISOString()
      };
      updatePDFProgress(updatedProgress);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="absolute top-8 right-8">
            <UserMenu />
          </div>
          <div className="flex items-center justify-center mb-6">
            <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg">
              <BookOpen className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            PDF Learning Assistant
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Transform your PDF documents into interactive flashcards and quizzes for better learning
          </p>
        </div>

        {/* Navigation */}
        {activeView !== 'home' && pdfData && (
          <div className="flex justify-center mb-8">
            <div className="bg-white rounded-2xl p-2 shadow-lg inline-flex">
              <button
                onClick={() => setActiveView('flashcards')}
                className={`
                  flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200
                  ${activeView === 'flashcards'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-blue-50'
                  }
                `}
              >
                <CreditCard className="h-5 w-5" />
                <span>Flashcards</span>
                {flashcards.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-xs bg-white/20 rounded-full">
                    {flashcards.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveView('quiz')}
                className={`
                  flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200
                  ${activeView === 'quiz'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-indigo-50'
                  }
                `}
              >
                <Brain className="h-5 w-5" />
                <span>Quiz</span>
                {quizQuestions.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-xs bg-white/20 rounded-full">
                    {quizQuestions.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="max-w-6xl mx-auto">
          {activeView === 'home' ? (
            <div className="bg-white rounded-3xl shadow-xl p-12">
              {/* Home Tabs */}
              <div className="flex justify-center mb-8">
                <div className="bg-gray-100 rounded-2xl p-2 inline-flex">
                  <button
                    onClick={() => setActiveHomeTab('upload')}
                    className={`
                      flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200
                      ${activeHomeTab === 'upload'
                        ? 'bg-white text-blue-600 shadow-md'
                        : 'text-gray-600 hover:text-gray-800'
                      }
                    `}
                  >
                    <Upload className="h-5 w-5" />
                    <span>Upload New PDF</span>
                  </button>
                  <button
                    onClick={() => setActiveHomeTab('progress')}
                    className={`
                      flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200
                      ${activeHomeTab === 'progress'
                        ? 'bg-white text-indigo-600 shadow-md'
                        : 'text-gray-600 hover:text-gray-800'
                      }
                    `}
                  >
                    <TrendingUp className="h-5 w-5" />
                    <span>In Progress PDFs</span>
                    {progressData.length > 0 && (
                      <span className="ml-1 px-2 py-0.5 text-xs bg-indigo-100 text-indigo-700 rounded-full">
                        {progressData.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              {activeHomeTab === 'upload' ? (
                <PDFUploader
                  onFileSelect={handleFileSelect}
                  isProcessing={isProcessing}
                  processingStep={processingStep}
                  processingProgress={processingProgress}
                  error={error}
                />
              ) : (
                <ProgressTracker
                  progressData={progressData}
                  onSelectPDF={handleSelectPDF}
                  onDeletePDF={deletePDFProgress}
                />
              )}
            </div>
          ) : activeView === 'flashcards' ? (
            <FlashcardViewer 
              flashcards={flashcards} 
              onBack={handleBackToUpload}
              onProgress={handleFlashcardProgress}
              initialIndex={currentPDFProgress?.currentFlashcardIndex || 0}
              viewedCards={currentPDFProgress?.flashcardsViewed || new Set()}
            />
          ) : (
            <QuizInterface 
              questions={quizQuestions} 
              onBack={handleBackToUpload}
              onProgress={handleQuizProgress}
              initialIndex={currentPDFProgress?.currentQuizIndex || 0}
              initialAnswers={[]} // Could store answers if needed
              answeredQuestions={currentPDFProgress?.quizAnswered || new Set()}
            />
          )}
        </div>

        {/* Footer */}
        {pdfData && (
          <div className="mt-12 text-center">
            <div className="inline-flex items-center space-x-2 px-6 py-3 bg-white/70 backdrop-blur-sm rounded-full shadow-lg">
              <FileText className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600 font-medium">
                <strong className="text-blue-600">{pdfData.filename}</strong> processed successfully
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;