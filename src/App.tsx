import React, { useState } from 'react';
import { BookOpen, CreditCard, Brain, FileText } from 'lucide-react';
import PDFUploader from './components/PDFUploader';
import FlashcardViewer from './components/FlashcardViewer';
import QuizInterface from './components/QuizInterface';
import { Flashcard, QuizQuestion } from './types';
import { extractTextFromPDF } from './utils/pdfProcessor';
import { generateFlashcards, generateQuizQuestions } from './utils/contentGenerator';

type ActiveView = 'upload' | 'flashcards' | 'quiz';

function App() {
  const [activeView, setActiveView] = useState<ActiveView>('upload');
  const [pdfData, setPdfData] = useState<{ filename: string; content: string } | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      console.log('📄 Processing PDF:', file.name);
      
      // Extract text from PDF
      const extractedData = await extractTextFromPDF(file);
      
      if (!extractedData.content || extractedData.content.trim().length === 0) {
        throw new Error('This PDF appears to contain no readable text. Please try a different PDF file.');
      }
      
      console.log('✅ PDF text extracted successfully');
      console.log('📊 Content length:', extractedData.content.length, 'characters');
      
      // Store PDF data
      setPdfData({
        filename: extractedData.filename,
        content: extractedData.content
      });
      
      // Generate flashcards and quiz questions
      console.log('🎯 Generating learning content...');
      const generatedFlashcards = generateFlashcards(extractedData.content);
      const generatedQuizQuestions = generateQuizQuestions(extractedData.content);
      
      setFlashcards(generatedFlashcards);
      setQuizQuestions(generatedQuizQuestions);
      
      console.log('✅ Content generation complete');
      console.log('📚 Generated:', generatedFlashcards.length, 'flashcards');
      console.log('❓ Generated:', generatedQuizQuestions.length, 'quiz questions');
      
      // Switch to flashcards view
      setActiveView('flashcards');
      
    } catch (err) {
      console.error('❌ Error processing PDF:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while processing the PDF');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBackToUpload = () => {
    setActiveView('upload');
    setPdfData(null);
    setFlashcards([]);
    setQuizQuestions([]);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
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

export default App;