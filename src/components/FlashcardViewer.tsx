import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, BookOpen } from 'lucide-react';
import { Flashcard } from '../types';

interface FlashcardViewerProps {
  flashcards: Flashcard[];
  onBack: () => void;
}

const FlashcardViewer: React.FC<FlashcardViewerProps> = ({ flashcards, onBack }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  if (!flashcards.length) {
    return (
      <div className="text-center py-20">
        <BookOpen className="h-20 w-20 text-gray-400 mx-auto mb-6" />
        <h3 className="text-2xl font-bold text-gray-900 mb-3">No Flashcards Generated</h3>
        <p className="text-gray-600 mb-6">Upload a PDF to generate flashcards automatically.</p>
        <button
          onClick={onBack}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors"
        >
          Upload PDF
        </button>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];

  const nextCard = () => {
    setCurrentIndex((prev) => (prev + 1) % flashcards.length);
    setIsFlipped(false);
  };

  const prevCard = () => {
    setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
    setIsFlipped(false);
  };

  const resetCards = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
        >
          <span>← Back to Upload</span>
        </button>
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Study Flashcards</h2>
          <p className="text-gray-600">{currentIndex + 1} of {flashcards.length}</p>
        </div>
        <button
          onClick={resetCards}
          className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          title="Reset to first card"
        >
          <RotateCcw className="h-5 w-5" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}
        />
      </div>

      {/* Flashcard */}
      <div className="relative h-80 perspective-1000 mb-8">
        <div
          className={`
            relative w-full h-full cursor-pointer transform-style-preserve-3d transition-transform duration-700
            ${isFlipped ? 'rotate-y-180' : ''}
          `}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          {/* Front of card */}
          <div className="absolute inset-0 w-full h-full backface-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 p-8 flex flex-col justify-center items-center text-white shadow-xl">
            <div className="text-center">
              <div className="mb-4">
                <span className="px-4 py-2 bg-white/20 rounded-full text-sm font-semibold tracking-wide">
                  {currentCard.category}
                </span>
              </div>
              <h3 className="text-xl font-bold mb-6 leading-relaxed max-w-2xl">{currentCard.question}</h3>
              <p className="text-blue-100 text-lg">Click to reveal answer</p>
            </div>
          </div>

          {/* Back of card */}
          <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-600 p-8 flex flex-col justify-center items-center text-white shadow-xl">
            <div className="text-center">
              <div className="mb-4">
                <span className="px-4 py-2 bg-white/20 rounded-full text-sm font-semibold tracking-wide">
                  Answer
                </span>
              </div>
              <div className="text-lg leading-relaxed max-w-3xl">
                {currentCard.answer.split('\n\n').map((paragraph, index) => (
                  <p key={index} className={index > 0 ? 'mt-4' : ''}>
                    {paragraph.startsWith('Context:') ? (
                      <span className="text-green-200 italic">{paragraph}</span>
                    ) : paragraph.startsWith('Significance:') ? (
                      <span className="text-green-200 font-medium">{paragraph}</span>
                    ) : paragraph.startsWith('Examples:') ? (
                      <span className="text-green-200">{paragraph}</span>
                    ) : paragraph.startsWith('Steps:') ? (
                      <span className="text-left block">{paragraph}</span>
                    ) : paragraph.startsWith('Purpose:') || paragraph.startsWith('Outcome:') ? (
                      <span className="text-green-200 font-medium">{paragraph}</span>
                    ) : paragraph.startsWith('Applications:') ? (
                      <span className="text-green-200">{paragraph}</span>
                    ) : (
                      paragraph
                    )}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-center space-x-6">
        <button
          onClick={prevCard}
          disabled={flashcards.length <= 1}
          className="flex items-center space-x-2 px-6 py-3 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200 rounded-xl transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
          <span>Previous</span>
        </button>

        <div className="px-6 py-3 bg-gray-100 rounded-xl">
          <span className="font-semibold text-gray-700">
            {currentIndex + 1} / {flashcards.length}
          </span>
        </div>

        <button
          onClick={nextCard}
          disabled={flashcards.length <= 1}
          className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-colors"
        >
          <span>Next</span>
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default FlashcardViewer;