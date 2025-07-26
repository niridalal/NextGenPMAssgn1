import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, BookOpen, Sparkles, Star, Trophy, Target, Home } from 'lucide-react';
import { Flashcard } from '../types';

interface FlashcardViewerProps {
  flashcards: Flashcard[];
  onGoHome?: () => void;
  onProgressChange?: (index: number) => void;
  initialIndex?: number;
}

const FlashcardViewer: React.FC<FlashcardViewerProps> = ({ flashcards, onGoHome, onProgressChange, initialIndex = 0 }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isFlipped, setIsFlipped] = useState(false);

  // Update current index when initialIndex prop changes
  React.useEffect(() => {
    setCurrentIndex(initialIndex);
    setIsFlipped(false);
  }, [initialIndex]);

  const currentCard = flashcards[currentIndex];

  const nextCard = () => {
    if (flashcards.length > 0) {
      const newIndex = (currentIndex + 1) % flashcards.length;
      setCurrentIndex(newIndex);
      onProgressChange?.(newIndex);
    }
    setIsFlipped(false);
  };

  const prevCard = () => {
    if (flashcards.length > 0) {
      const newIndex = (currentIndex - 1 + flashcards.length) % flashcards.length;
      setCurrentIndex(newIndex);
      onProgressChange?.(newIndex);
    }
    setIsFlipped(false);
  };

  const flipCard = () => {
    setIsFlipped(!isFlipped);
  };

  if (!flashcards.length) {
    return (
      <div className="relative min-h-[600px] overflow-hidden">
        {/* Home Button */}
        {onGoHome && (
          <div className="absolute top-4 left-4 z-10">
            <button
              onClick={onGoHome}
              className="flex items-center space-x-2 px-4 py-2 bg-white/95 backdrop-blur-md hover:bg-white text-gray-700 hover:text-gray-900 rounded-xl shadow-lg border border-white/30 transition-all duration-200 font-medium"
            >
              <Home className="h-5 w-5" />
              <span>Home</span>
            </button>
          </div>
        )}
        
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
          <div className="absolute top-10 left-10 w-32 h-32 bg-blue-200/30 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-purple-200/30 rounded-full blur-xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-20 left-1/3 w-40 h-40 bg-indigo-200/30 rounded-full blur-xl animate-pulse delay-500"></div>
        </div>
        
        <div className="relative z-10 text-center py-32">
          <div className="relative mb-12">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur-2xl opacity-20 animate-pulse"></div>
            <div className="relative p-8 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full inline-block shadow-2xl">
              <BookOpen className="h-24 w-24 text-blue-600" />
            </div>
          </div>
          
          <div className="space-y-6">
            <h3 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Ready to Learn?
            </h3>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Upload a PDF document to automatically generate interactive flashcards and start your personalized learning journey.
            </p>
            
            <div className="flex items-center justify-center space-x-8 mt-12">
              <div className="flex items-center space-x-3 px-6 py-3 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-gray-700 font-medium">AI-Powered</span>
              </div>
              <div className="flex items-center space-x-3 px-6 py-3 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse delay-300"></div>
                <span className="text-gray-700 font-medium">Interactive</span>
              </div>
              <div className="flex items-center space-x-3 px-6 py-3 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20">
                <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse delay-700"></div>
                <span className="text-gray-700 font-medium">Personalized</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[700px]">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 via-violet-50/20 to-indigo-50/30 rounded-3xl">
        <div className="absolute top-10 left-10 w-64 h-64 bg-gradient-to-br from-purple-200/15 to-pink-200/15 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-56 h-56 bg-gradient-to-br from-indigo-200/20 to-violet-200/20 rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-gradient-to-br from-blue-200/10 to-purple-200/10 rounded-full blur-xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 w-full max-w-4xl mx-auto">
        {/* Enhanced Header */}
        <div className="mb-12 text-center">
          {/* Home Button */}
          {onGoHome && (
            <div className="flex justify-start mb-6">
              <button
                onClick={onGoHome}
                className="flex items-center space-x-2 px-4 py-2 bg-white/95 backdrop-blur-md hover:bg-white text-gray-700 hover:text-gray-900 rounded-xl shadow-lg border border-white/30 transition-all duration-200 font-medium"
              >
                <Home className="h-5 w-5" />
                <span>Home</span>
              </button>
            </div>
          )}
          
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl blur-lg opacity-40 animate-pulse"></div>
              <div className="relative p-4 bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 rounded-2xl shadow-xl">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
          
          <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-purple-800 to-indigo-900 bg-clip-text text-transparent mb-4">
            Interactive Flashcards
          </h2>
          <p className="text-xl text-gray-600 mb-6">Master your knowledge with AI-generated study cards</p>
          
          {/* Progress Bar */}
          <div className="max-w-md mx-auto mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-600">Progress</span>
              <span className="text-sm font-semibold text-gray-600">{Math.round(((currentIndex + 1) / flashcards.length) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
              <div 
                className="bg-gradient-to-r from-purple-500 to-indigo-600 h-3 rounded-full shadow-lg transition-all duration-500 ease-out"
                style={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="flex items-center justify-center space-x-6 mb-8">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl px-6 py-4 shadow-lg border border-white/30">
              <div className="text-2xl font-bold text-purple-600">{currentIndex + 1}</div>
              <div className="text-sm text-gray-600 font-medium">Current</div>
            </div>
            <div className="bg-white/95 backdrop-blur-md rounded-2xl px-6 py-4 shadow-lg border border-white/30">
              <div className="text-2xl font-bold text-indigo-600">{flashcards.length}</div>
              <div className="text-sm text-gray-600 font-medium">Total</div>
            </div>
            <div className="bg-white/95 backdrop-blur-md rounded-2xl px-6 py-4 shadow-lg border border-white/30">
              <div className="text-2xl font-bold text-violet-600">{flashcards.length - currentIndex}</div>
              <div className="text-sm text-gray-600 font-medium">Remaining</div>
            </div>
          </div>
        </div>

        {/* Enhanced Flashcard */}
        <div className="relative h-[400px] perspective-1000 mb-12">
          <div
            className={`
              relative w-full h-full cursor-pointer transform-style-preserve-3d transition-all duration-700 hover:scale-105
              ${isFlipped ? 'rotate-y-180' : ''}
            `}
            onClick={flipCard}
          >
            {/* Front of card */}
            <div className={`absolute inset-0 w-full h-full backface-hidden rounded-3xl bg-gradient-to-br from-purple-600 via-violet-600 to-indigo-600 p-12 flex flex-col justify-center items-center text-white shadow-2xl border border-white/10 transition-transform duration-300 ${isFlipped ? 'rotate-y-180' : ''}`}>
              <div className="text-center w-full">
                <div className="flex items-center justify-center space-x-3 mb-8">
                  <div className="px-6 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-bold tracking-wide">
                    {currentCard.category || 'Question'}
                  </div>
                </div>
                
                <h3 className="text-3xl font-bold leading-relaxed mb-12 max-w-2xl">
                  {currentCard.question}
                </h3>
                
                <div className="flex items-center justify-center space-x-4 text-sm opacity-90">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-200"></div>
                  </div>
                  <span className="font-medium">Click to reveal answer</span>
                </div>
              </div>
            </div>

            {/* Back of card */}
            <div className={`absolute inset-0 w-full h-full backface-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 p-12 flex flex-col justify-center items-center text-white shadow-2xl border border-white/10 transition-transform duration-300 ${isFlipped ? '' : 'rotate-y-180'}`}>
              <div className="text-center w-full">
                <div className="flex items-center justify-center space-x-3 mb-8">
                  <div className="px-6 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-bold tracking-wide">
                    Answer
                  </div>
                </div>
                
                <p className="text-2xl font-semibold leading-relaxed mb-12 max-w-2xl">
                  {currentCard.answer}
                </p>
                
                <div className="flex items-center justify-center space-x-4 text-sm opacity-90">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse delay-300"></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse delay-600"></div>
                  </div>
                  <span className="font-medium">Click to see question</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Navigation */}
        <div className="flex items-center justify-center space-x-8">
          <button
            onClick={prevCard}
            disabled={flashcards.length <= 1}
            className="group flex items-center space-x-4 px-8 py-4 bg-white/95 backdrop-blur-md hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl shadow-xl border border-white/30 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
          >
            <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full group-hover:scale-110 transition-transform duration-200">
              <ChevronLeft className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-gray-700 group-hover:text-gray-900">Previous</span>
          </button>

          <button
            onClick={() => {
              setCurrentIndex(0);
              setIsFlipped(false);
            }}
            className="group p-4 bg-gradient-to-r from-purple-100 to-violet-200 hover:from-purple-200 hover:to-violet-300 rounded-2xl shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl"
            title="Reset to first card"
          >
            <RotateCcw className="h-6 w-6 text-purple-600 group-hover:text-purple-800 group-hover:rotate-180 transition-all duration-300" />
          </button>

          <button
            onClick={nextCard}
            disabled={flashcards.length <= 1}
            className="group flex items-center space-x-4 px-8 py-4 bg-white/95 backdrop-blur-md hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl shadow-xl border border-white/30 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
          >
            <span className="font-bold text-gray-700 group-hover:text-gray-900">Next</span>
            <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full group-hover:scale-110 transition-transform duration-200">
              <ChevronRight className="h-5 w-5 text-white" />
            </div>
          </button>
        </div>

        {/* Floating Action Hint */}
        {!isFlipped && (
          <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-md rounded-2xl px-4 py-2 shadow-lg border border-white/30 animate-bounce">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Sparkles className="h-4 w-4" />
              <span className="font-medium">Tap card to flip</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlashcardViewer;