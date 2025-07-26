import React, { useState } from 'react';
import { CheckCircle, XCircle, ArrowRight, RotateCcw, Trophy } from 'lucide-react';
import { QuizQuestion } from '../types';

interface QuizInterfaceProps {
  questions: QuizQuestion[];
  onBack: () => void;
  onProgress?: (currentIndex: number, answeredIds: Set<string>, answers: number[]) => void;
  initialIndex?: number;
  initialAnswers?: number[];
  answeredQuestions?: Set<string>;
}

const QuizInterface: React.FC<QuizInterfaceProps> = ({ 
  questions, 
  onBack, 
  onProgress,
  initialIndex = 0,
  initialAnswers = [],
  answeredQuestions = new Set()
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(initialIndex);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>(initialAnswers);
  const [showResults, setShowResults] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState<Set<string>>(new Set(answeredQuestions));

  if (!questions.length) {
    return (
      <div className="text-center py-20">
        <Trophy className="h-20 w-20 text-gray-400 mx-auto mb-6" />
        <h3 className="text-2xl font-bold text-gray-900 mb-3">No Quiz Questions Generated</h3>
        <p className="text-gray-600 mb-6">Upload a PDF to generate quiz questions automatically.</p>
        <button
          onClick={onBack}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors"
        >
          Upload PDF
        </button>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const userAnswer = selectedAnswers[currentQuestionIndex];
  const isAnswered = userAnswer !== undefined;

  const handleAnswerSelect = (optionIndex: number) => {
    if (showResults) return;
    
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = optionIndex;
    setSelectedAnswers(newAnswers);
    
    // Mark question as answered
    const newAnsweredIds = new Set(answeredQuestionIds);
    newAnsweredIds.add(currentQuestion.id);
    setAnsweredQuestionIds(newAnsweredIds);
    
    // Update progress
    onProgress?.(currentQuestionIndex, newAnsweredIds, newAnswers);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      const newIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(newIndex);
      setShowResults(false);
      onProgress?.(newIndex, answeredQuestionIds, selectedAnswers);
    } else {
      setQuizCompleted(true);
    }
  };

  const showAnswer = () => {
    setShowResults(true);
  };

  const resetQuiz = () => {
    const newIndex = 0;
    const newAnswers: number[] = [];
    const newAnsweredIds = new Set<string>();
    
    setCurrentQuestionIndex(newIndex);
    setSelectedAnswers(newAnswers);
    setShowResults(false);
    setQuizCompleted(false);
    setAnsweredQuestionIds(newAnsweredIds);
    
    onProgress?.(newIndex, newAnsweredIds, newAnswers);
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correctAnswer) {
        correct++;
      }
    });
    return { correct, total: questions.length, percentage: Math.round((correct / questions.length) * 100) };
  };

  if (quizCompleted) {
    const score = calculateScore();
    return (
      <div className="w-full max-w-2xl mx-auto text-center">
        <div className="bg-white rounded-3xl shadow-xl p-12">
          <Trophy className={`h-20 w-20 mx-auto mb-6 ${score.percentage >= 70 ? 'text-yellow-500' : 'text-gray-400'}`} />
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Quiz Complete!</h2>
          
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="bg-green-50 rounded-xl p-4">
              <div className="text-2xl font-bold text-green-700">{score.correct}</div>
              <div className="text-green-600">Correct</div>
            </div>
            <div className="bg-red-50 rounded-xl p-4">
              <div className="text-2xl font-bold text-red-700">{score.total - score.correct}</div>
              <div className="text-red-600">Incorrect</div>
            </div>
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="text-2xl font-bold text-blue-700">{score.percentage}%</div>
              <div className="text-blue-600">Score</div>
            </div>
          </div>

          <div className="space-x-4">
            <button
              onClick={resetQuiz}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors"
            >
              Retake Quiz
            </button>
            <button
              onClick={onBack}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors"
            >
              Upload New PDF
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
        >
          <span>← Back to Upload</span>
        </button>
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Knowledge Quiz</h2>
          <p className="text-gray-600">Question {currentQuestionIndex + 1} of {questions.length}</p>
        </div>
        <button
          onClick={resetQuiz}
          className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          title="Reset quiz"
        >
          <RotateCcw className="h-5 w-5" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question */}
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
          <h3 className="text-lg font-bold text-white leading-relaxed">
            {currentQuestion.question}
          </h3>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-4">
            {currentQuestion.options.map((option, index) => {
              const isSelected = userAnswer === index;
              const isCorrect = index === currentQuestion.correctAnswer;
              const showCorrect = showResults && isCorrect;
              const showIncorrect = showResults && isSelected && !isCorrect;
              const wasAnswered = answeredQuestionIds.has(currentQuestion.id);

              return (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={showResults}
                  className={`
                    w-full text-left p-5 rounded-xl border-2 transition-all duration-200 font-medium
                    ${showCorrect 
                      ? 'border-green-500 bg-green-50 text-green-800' 
                      : showIncorrect
                      ? 'border-red-500 bg-red-50 text-red-800'
                      : isSelected
                      ? 'border-blue-500 bg-blue-50 text-blue-800'
                      : wasAnswered && !showResults
                      ? 'border-gray-400 bg-gray-50 text-gray-700'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                    }
                    ${showResults ? 'cursor-default' : 'cursor-pointer'}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <span className="leading-relaxed flex items-center space-x-2">
                      <span>{option}</span>
                      {wasAnswered && !showResults && isSelected && (
                        <span className="text-xs text-blue-600">✓ Selected</span>
                      )}
                    </span>
                    {showResults && (
                      <div>
                        {isCorrect ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : isSelected ? (
                          <XCircle className="h-5 w-5 text-red-600" />
                        ) : null}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {showResults && (
            <div className="mt-6 p-6 bg-blue-50 border border-blue-200 rounded-xl">
              <h4 className="font-bold text-blue-900 mb-2">Explanation</h4>
              <div className="text-blue-800 leading-relaxed">
                {currentQuestion.explanation.split('\n\n').map((paragraph, index) => (
                  <p key={index} className={index > 0 ? 'mt-3' : ''}>
                    {paragraph.startsWith('This is important because') || paragraph.startsWith('This is significant because') ? (
                      <span className="font-medium italic">{paragraph}</span>
                    ) : paragraph.startsWith('Full context:') ? (
                      <span className="text-blue-700">{paragraph}</span>
                    ) : (
                      paragraph
                    )}
                  </p>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 flex justify-between items-center">
            {!showResults && isAnswered ? (
              <button
                onClick={showAnswer}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors"
              >
                Show Answer
              </button>
            ) : (
              <div></div>
            )}

            {showResults && (
              <button
                onClick={handleNext}
                className="flex items-center space-x-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors ml-auto font-semibold"
              >
                <span>{currentQuestionIndex === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}</span>
                <ArrowRight className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizInterface;