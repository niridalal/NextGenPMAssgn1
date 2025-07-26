import React, { useState } from 'react';
import { BookOpen, CreditCard, Brain, FileText } from 'lucide-react';
import { AuthProvider } from './contexts/AuthContext';
import AuthGuard from './components/AuthGuard';
import UserMenu from './components/UserMenu';
import PDFUploader from './components/PDFUploader';
import FlashcardViewer from './components/FlashcardViewer';
import QuizInterface from './components/QuizInterface';
import { Flashcard, QuizQuestion } from './types';
import { extractTextFromPDF } from './utils/pdfProcessor';
import { analyzeContentWithOpenAI } from './utils/contentGenerator';

type ActiveView = 'upload' | 'flashcards' | 'quiz';

function AppContent() {
  const [activeView, setActiveView] = useState<ActiveView>('upload');
  const [pdfData, setPdfData] = useState<{ filename: string; content: string } | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

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
    setActiveView('upload');
    setPdfData(null);
    setFlashcards([]);
    setQuizQuestions([]);
    setError(null);
    setProcessingStep('');
    setProcessingProgress(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex-1"></div>
          <div className="text-center flex-1">
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
          <div className="flex-1 flex justify-end">
            <UserMenu />
          </div>
        </div>

        {/* Navigation */}
        {pdfData && (
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
          {activeView === 'upload' ? (
            <div className="bg-white rounded-3xl shadow-xl p-12">
              <PDFUploader
                onFileSelect={handleFileSelect}
                isProcessing={isProcessing}
                processingStep={processingStep}
                processingProgress={processingProgress}
                error={error}
              />
            </div>
          ) : activeView === 'flashcards' ? (
            <div className="bg-white rounded-3xl shadow-xl p-12">
              <FlashcardViewer 
                flashcards={flashcards} 
                onBack={handleBackToUpload}
              />
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-xl p-12">
              <QuizInterface 
                questions={quizQuestions} 
                onBack={handleBackToUpload}
              />
            </div>
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

function App() {
  return (
    <AuthProvider>
      <AuthGuard>
        <AppContent />
      </AuthGuard>
    </AuthProvider>
  );
}

export default App;