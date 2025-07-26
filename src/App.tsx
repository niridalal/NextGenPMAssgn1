import React, { useState } from 'react';
import { BookOpen, CreditCard, Brain, FileText, Sparkles, Clock } from 'lucide-react';
import AuthWrapper from './components/AuthWrapper';
import PDFUploader from './components/PDFUploader';
import FlashcardViewer from './components/FlashcardViewer';
import QuizInterface from './components/QuizInterface';
import ProfileDropdown from './components/ProfileDropdown';
import DocumentLibrary from './components/DocumentLibrary';
import { supabase } from './lib/supabase';
import { PDFData, Flashcard, QuizQuestion } from './types';
import { extractTextFromPDF } from './utils/pdfProcessor';
import { generateFlashcards, generateQuizQuestions } from './utils/contentGenerator';
import { User } from '@supabase/supabase-js';

type ActiveTab = 'upload' | 'flashcards' | 'quiz' | 'documents';

interface Document {
  id: string;
  filename: string;
  content: string;
  page_count: number;
  created_at: string;
  updated_at: string;
  flashcard_count?: number;
  quiz_count?: number;
}

function App() {
  return (
    <AuthWrapper>
      {(user) => <MainApp user={user} />}
    </AuthWrapper>
  );
}

interface MainAppProps {
  user: User;
}

function MainApp({ user }: MainAppProps) {
  const [activeTab, setActiveTab] = useState<AllTabs>('upload');
  const [pdfData, setPdfData] = useState<PDFData | null>(null);
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState('');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Load documents and progress on component mount
  React.useEffect(() => {
    fetchDocuments();
  }, [user]);

  const fetchDocuments = async () => {
    try {
      const { data: docsData, error: docsError } = await supabase
        .from('pdfs')
        .select(`
          id,
          filename,
          content,
          page_count,
          created_at,
          updated_at
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (docsError) throw docsError;

      // Get flashcard and quiz counts for each document
      const documentsWithCounts = await Promise.all(
        (docsData || []).map(async (doc) => {
          const [flashcardResult, quizResult] = await Promise.all([
            supabase
              .from('flashcards')
              .select('id', { count: 'exact' })
              .eq('pdf_id', doc.id),
            supabase
              .from('quiz_questions')
              .select('id', { count: 'exact' })
              .eq('pdf_id', doc.id)
          ]);

          return {
            ...doc,
            flashcard_count: flashcardResult.count || 0,
            quiz_count: quizResult.count || 0
          };
        })
      );

      setDocuments(documentsWithCounts);
    } catch (error: any) {
      console.error('Error fetching documents:', error);
    }
  };

  const handleDocumentSelect = async (document: Document) => {
    try {
      setCurrentDocument(document);
      setPdfData({
        filename: document.filename,
        text: document.content,
        pageCount: document.page_count
      });

      // Load flashcards and quiz questions from database
      const [flashcardResult, quizResult] = await Promise.all([
        supabase
          .from('flashcards')
          .select('*')
          .eq('pdf_id', document.id)
          .order('created_at', { ascending: true }),
        supabase
          .from('quiz_questions')
          .select('*')
          .eq('pdf_id', document.id)
          .order('created_at', { ascending: true })
      ]);

      if (flashcardResult.data) {
        const formattedFlashcards = flashcardResult.data.map((card, index) => ({
          id: index + 1,
          question: card.question,
          answer: card.answer,
          category: card.category
        }));
        setFlashcards(formattedFlashcards);
      }

      if (quizResult.data) {
        const formattedQuestions = quizResult.data.map((question, index) => ({
          id: index + 1,
          question: question.question,
          options: question.options,
          correctAnswer: question.correct_answer,
          explanation: question.explanation
        }));
        setQuizQuestions(formattedQuestions);
      }

      // Switch to flashcards tab
      setActiveTab('flashcards');
    } catch (error: any) {
      console.error('Error loading document:', error);
      setError(error.message);
    }
  };

  const handleFileSelect = async (file: File) => {
    setIsProcessing(true);
    setError(null);
    setProcessingStage('extracting');
    setProcessingProgress(10);
    
    try {
      // Extract text from PDF
      setProcessingStage('extracting');
      setProcessingProgress(30);
      const extractedData = await extractTextFromPDF(file);
      setPdfData(extractedData);
      
      // Check if PDF contains extractable text
      if (!extractedData.text || extractedData.text.trim().length === 0) {
        setError('This PDF appears to be unreadable or contains no extractable text. This can happen with:\n\n• Scanned documents or images\n• Password-protected PDFs\n• Corrupted files\n• PDFs with only images/graphics\n\nPlease try uploading a different PDF with readable text content.');
        setIsProcessing(false);
        return;
      }
      
      setProcessingStage('generating');
      setProcessingProgress(60);
      
      // Generate flashcards and quiz questions locally
      const generatedFlashcards = generateFlashcards(extractedData.text);
      const generatedQuizQuestions = generateQuizQuestions(extractedData.text);
      
      setFlashcards(generatedFlashcards);
      setQuizQuestions(generatedQuizQuestions);
      
      setProcessingStage('saving');
      setProcessingProgress(80);
      
      // Save to database
      const { data: pdfRecord, error: pdfError } = await supabase
        .from('pdfs')
        .insert({
          user_id: user.id,
          filename: extractedData.filename,
          content: extractedData.text,
          page_count: extractedData.pageCount,
        })
        .select()
        .single();

      if (pdfError) throw pdfError;

      // Save flashcards
      if (generatedFlashcards.length > 0) {
        const flashcardInserts = generatedFlashcards.map(card => ({
          pdf_id: pdfRecord.id,
          user_id: user.id,
          question: card.question,
          answer: card.answer,
          category: card.category || 'General',
        }));

        await supabase.from('flashcards').insert(flashcardInserts);
      }

      // Save quiz questions
      if (generatedQuizQuestions.length > 0) {
        const quizInserts = generatedQuizQuestions.map(question => ({
          pdf_id: pdfRecord.id,
          user_id: user.id,
          question: question.question,
          options: question.options,
          correct_answer: question.correctAnswer,
          explanation: question.explanation,
        }));

        await supabase.from('quiz_questions').insert(quizInserts);
      }

      setCurrentDocument({
        id: pdfRecord.id,
        filename: pdfRecord.filename,
        content: pdfRecord.content,
        page_count: pdfRecord.page_count,
        created_at: pdfRecord.created_at,
        updated_at: pdfRecord.updated_at,
        flashcard_count: generatedFlashcards.length,
        quiz_count: generatedQuizQuestions.length
      });

      setProcessingProgress(100);
      
      // Automatically switch to flashcards after upload
      setActiveTab('flashcards');
      
      // Refresh documents list
      fetchDocuments();
    } catch (err) {
      console.error('Error processing PDF:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while processing the PDF');
    } finally {
      setIsProcessing(false);
      setProcessingStage('');
      setProcessingProgress(0);
    }
  };

  const handleGoHome = () => {
    setActiveTab('upload');
    setPdfData(null);
    setCurrentDocument(null);
    setFlashcards([]);
    setQuizQuestions([]);
    setError(null);
  };

  const tabs = [
    { id: 'upload' as const, label: 'Upload PDF', icon: FileText },
    { id: 'flashcards' as const, label: 'Flashcards', icon: CreditCard },
    { id: 'quiz' as const, label: 'Quiz', icon: Brain },
  ];


  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50/40 to-indigo-100/60 relative overflow-hidden">
      {/* Enhanced Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large floating orbs */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-br from-purple-300/20 to-pink-300/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 -right-32 w-80 h-80 bg-gradient-to-br from-blue-300/25 to-indigo-300/25 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute -bottom-32 left-1/4 w-72 h-72 bg-gradient-to-br from-violet-300/20 to-purple-300/20 rounded-full blur-3xl animate-pulse delay-500"></div>
        
        {/* Medium floating elements */}
        <div className="absolute top-20 left-1/3 w-48 h-48 bg-gradient-to-br from-cyan-200/15 to-blue-200/15 rounded-full blur-2xl animate-pulse delay-700"></div>
        <div className="absolute bottom-40 right-1/3 w-56 h-56 bg-gradient-to-br from-indigo-200/20 to-purple-200/20 rounded-full blur-2xl animate-pulse delay-300"></div>
        
        {/* Small accent elements */}
        <div className="absolute top-1/2 left-20 w-32 h-32 bg-gradient-to-br from-pink-200/25 to-rose-200/25 rounded-full blur-xl animate-pulse delay-1500"></div>
        <div className="absolute top-3/4 right-20 w-40 h-40 bg-gradient-to-br from-emerald-200/20 to-teal-200/20 rounded-full blur-xl animate-pulse delay-200"></div>
        
        {/* Geometric shapes */}
        <div className="absolute top-1/4 right-1/4 w-24 h-24 bg-gradient-to-br from-yellow-200/30 to-orange-200/30 rounded-lg rotate-45 blur-lg animate-pulse delay-800"></div>
        <div className="absolute bottom-1/4 left-1/5 w-20 h-20 bg-gradient-to-br from-purple-200/35 to-violet-200/35 rounded-full blur-lg animate-pulse delay-1200"></div>
        
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(139,69,193,0.05)_1px,transparent_0)] bg-[length:40px_40px]"></div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        {/* Profile Dropdown */}
        <div className="absolute top-4 right-4 z-10">
          <ProfileDropdown 
            user={user} 
            onSignOut={() => {}} 
            onShowDocuments={() => setActiveTab('documents')}
          />
        </div>
        
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl blur-lg opacity-40 animate-pulse"></div>
              <div className="relative p-4 bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 rounded-2xl shadow-2xl">
                <BookOpen className="h-10 w-10 text-white" />
              </div>
            </div>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 via-purple-800 to-indigo-900 bg-clip-text text-transparent mb-4">
            PDF Learning Assistant
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Transform your PDF documents into interactive learning experiences with AI-powered flashcards and quizzes
          </p>
          <div className="flex items-center justify-center mt-6 space-x-2 text-sm text-gray-500">
            <Sparkles className="h-4 w-4" />
            <span>Powered by intelligent content analysis</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-12">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-2 shadow-2xl border border-white/30 inline-flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const isDisabled = (tab.id === 'flashcards' || tab.id === 'quiz') && !pdfData && !currentDocument;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => !isDisabled && setActiveTab(tab.id)}
                  disabled={isDisabled}
                  className={`
                    flex items-center space-x-3 px-6 py-3 rounded-xl font-semibold transition-all duration-300 relative overflow-hidden whitespace-nowrap
                    ${isActive
                      ? 'bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 text-white shadow-lg'
                      : isDisabled
                      ? 'text-gray-400 cursor-not-allowed opacity-50'
                      : 'text-gray-700 hover:bg-purple-50/50 hover:text-purple-900'
                    }
                  `}
                >
                  <Icon className={`h-5 w-5`} />
                  <span>{tab.label}</span>
                  {tab.id === 'flashcards' && flashcards.length > 0 && (
                    <span className={`ml-1 px-2 py-0.5 text-xs font-bold rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-700'}`}>
                      {flashcards.length}
                    </span>
                  )}
                  {tab.id === 'quiz' && quizQuestions.length > 0 && (
                    <span className={`ml-1 px-2 py-0.5 text-xs font-bold rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-700'}`}>
                      {quizQuestions.length}
                    </span>
                  )}
                  {tab.id === 'documents' && documents.length > 0 && (
                    <span className={`ml-1 px-2 py-0.5 text-xs font-bold rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'}`}>
                      {documents.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="max-w-6xl mx-auto">
          {activeTab === 'upload' ? (
            <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-white/30 p-12 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 to-indigo-50/30 rounded-3xl"></div>
              <div className="relative z-10">
              <PDFUploader
                onFileSelect={handleFileSelect}
                isProcessing={isProcessing}
                processingStage={processingStage}
                processingProgress={processingProgress}
                error={error}
              />
              </div>
            </div>
          ) : activeTab === 'flashcards' ? (
            <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-white/30 p-12 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-purple-50/30 rounded-3xl"></div>
              <div className="relative z-10">
                <FlashcardViewer 
                  flashcards={flashcards} 
                  onGoHome={handleGoHome}
                />
              </div>
            </div>
          ) : activeTab === 'quiz' ? (
            <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-white/30 p-12 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/30 to-violet-50/30 rounded-3xl"></div>
              <div className="relative z-10">
                <QuizInterface 
                  questions={quizQuestions} 
                  onGoHome={handleGoHome}
                />
              </div>
            </div>
          ) : activeTab === 'documents' ? (
            <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-white/30 p-12 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-green-50/30 to-blue-50/30 rounded-3xl"></div>
              <div className="relative z-10">
                <DocumentLibrary 
                  user={user} 
                  onDocumentSelect={handleDocumentSelect}
                />
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        {!pdfData && !currentDocument && activeTab === 'upload' && (
          <div className="mt-20 text-center">
          <div className="inline-flex items-center space-x-2 px-6 py-3 bg-white/70 backdrop-blur-md rounded-full border border-white/40 shadow-xl">
            <BookOpen className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600 font-medium">Upload a PDF to get started with AI-powered learning tools</span>
          </div>
          </div>
        )}
        
        {/* Post-upload message */}
        {(pdfData || currentDocument) && (
          <div className="mt-20 text-center">
            <div className="inline-flex items-center space-x-2 px-6 py-3 bg-white/70 backdrop-blur-md rounded-full border border-white/40 shadow-xl">
              <Sparkles className="h-4 w-4 text-purple-500" />
              <span className="text-gray-600 font-medium">
                <strong className="text-purple-600">{pdfData?.filename || currentDocument?.filename}</strong> processed successfully! Choose flashcards or quiz to start learning.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;