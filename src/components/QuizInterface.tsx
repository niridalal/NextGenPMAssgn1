import React, { useState } from 'react';
import { CheckCircle, XCircle, ArrowRight, RotateCcw, Trophy, Clock, Play, Settings, Home } from 'lucide-react';
import { QuizQuestion } from '../types';

interface QuizInterfaceProps {
  questions: QuizQuestion[];
  onGoHome?: () => void;
}

const QuizInterface: React.FC<QuizInterfaceProps> = ({ questions, onGoHome }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timeLimit, setTimeLimit] = useState(30); // minutes
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);

  // Cleanup timer on component unmount
  React.useEffect(() => {
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [timerInterval]);

  // Update current question index when initialIndex prop changes
  React.useEffect(() => {
    setShowResults(false);

  const currentQuestion = questions[currentQuestionIndex];
  const userAnswer = selectedAnswers[currentQuestionIndex];
  const isAnswered = userAnswer !== undefined;

  const handleAnswerSelect = (optionIndex: number) => {
    if (isAnswered && !showResults) return;
    
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = optionIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      const newIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(newIndex);
      setShowResults(false);
    } else {
      setQuizCompleted(true);
      // Clear timer when quiz completes
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }
    }
  };

  const showAnswer = () => {
    setShowResults(true);
  };

  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers([]);
    setShowResults(false);
    setQuizCompleted(false);
    setQuizStarted(false);
    setTimeRemaining(0);
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
  };

  const startQuiz = () => {
    setQuizStarted(true);
    setShowSettings(false);
    
    if (timerEnabled) {
      const totalSeconds = timeLimit * 60;
      setTimeRemaining(totalSeconds);
      
      const interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setQuizCompleted(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      setTimerInterval(interval);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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

  if (!questions.length) {
    return (
      <div className="text-center py-20">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gray-200 rounded-full blur-lg opacity-20"></div>
          <div className="relative p-6 bg-gray-100 rounded-full inline-block">
            <Trophy className="h-20 w-20 text-gray-400" />
          </div>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-3">No Quiz Questions Generated</h3>
        <p className="text-lg text-gray-600 max-w-md mx-auto">Upload a PDF to generate quiz questions automatically and test your knowledge.</p>
      </div>
    );
  }

  if (!quizStarted) {
    return (
      <div className="w-full max-w-3xl mx-auto">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Quiz Settings</h2>
          <p className="text-gray-600">Configure your quiz preferences before starting</p>
        </div>

        <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-2xl overflow-hidden border border-gray-100 p-8">
          <div className="space-y-8">
            {/* Quiz Info */}
            <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200/50">
              <div className="flex items-center justify-center mb-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Trophy className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to Test Your Knowledge?</h3>
              <p className="text-gray-600 mb-4">This quiz contains {questions.length} questions based on your PDF content</p>
              <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>{questions.length} Questions</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Multiple Choice</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Instant Feedback</span>
                </div>
              </div>
            </div>

            {/* Timer Settings */}
            <div className="space-y-6">
              <div className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl border border-gray-200">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-orange-100 rounded-full">
                    <Clock className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">Time Limit</h4>
                    <p className="text-gray-600">Add a timer to challenge yourself</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={timerEnabled}
                    onChange={(e) => setTimerEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {timerEnabled && (
                <div className="p-6 bg-orange-50 rounded-2xl border border-orange-200/50 space-y-4">
                  <h5 className="font-semibold text-gray-900">Select Time Limit</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[15, 30, 45, 60].map((minutes) => (
                      <button
                        key={minutes}
                        onClick={() => setTimeLimit(minutes)}
                        className={`p-4 rounded-xl border-2 transition-all duration-200 font-semibold ${
                          timeLimit === minutes
                            ? 'border-orange-500 bg-orange-100 text-orange-700'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-orange-300 hover:bg-orange-50'
                        }`}
                      >
                        {minutes} min
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-orange-700 bg-orange-100 p-3 rounded-lg">
                    <Clock className="h-4 w-4" />
                    <span>Quiz will auto-submit when time runs out</span>
                  </div>
                </div>
              )}
            </div>

            {/* Start Button */}
            <div className="text-center pt-4">
              <button
                onClick={startQuiz}
                className="flex items-center space-x-3 mx-auto px-8 py-4 bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-700 hover:via-violet-700 hover:to-indigo-700 text-white rounded-xl shadow-lg transition-all duration-200 hover:scale-105 font-semibold text-lg"
              >
                <Play className="h-6 w-6" />
                <span>Start Quiz</span>
                {timerEnabled && (
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                    {timeLimit} min
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (quizCompleted) {
    const score = calculateScore();
    return (
      <div className="w-full max-w-3xl mx-auto text-center">
        <div className="bg-gradient-to-br from-white to-purple-50/30 rounded-3xl shadow-2xl p-12 border border-purple-100/50 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50/20 to-indigo-50/20 rounded-3xl"></div>
          <div className="relative z-10">
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
          
          <div className="mb-10">
            <div className="relative mb-6">
              <div className={`absolute inset-0 rounded-full blur-lg opacity-30 ${score.percentage >= 70 ? 'bg-yellow-400' : 'bg-gray-400'}`}></div>
              <div className="relative">
                <Trophy className={`h-24 w-24 mx-auto ${score.percentage >= 70 ? 'text-yellow-500' : 'text-gray-400'}`} />
              </div>
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-3">Quiz Complete!</h2>
            <p className="text-xl text-gray-600">Here's how you performed</p>
          </div>

          <div className="grid grid-cols-3 gap-6 mb-12">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 shadow-lg border border-purple-200/50">
              <div className="text-3xl font-bold text-purple-700 mb-2">{score.correct}</div>
              <div className="text-purple-600 font-semibold">Correct</div>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-6 shadow-lg border border-red-200/50">
              <div className="text-3xl font-bold text-red-700 mb-2">{score.total - score.correct}</div>
              <div className="text-red-600 font-semibold">Incorrect</div>
            </div>
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl p-6 shadow-lg border border-indigo-200/50">
              <div className="text-3xl font-bold text-indigo-700 mb-2">{score.percentage}%</div>
              <div className="text-indigo-600 font-semibold">Score</div>
            </div>
          </div>

          <button
            onClick={resetQuiz}
            className="flex items-center space-x-3 mx-auto px-8 py-4 bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-700 hover:via-violet-700 hover:to-indigo-700 text-white rounded-xl shadow-lg transition-all duration-200 hover:scale-105 font-semibold"
          >
            <RotateCcw className="h-6 w-6" />
            <span>Retake Quiz</span>
          </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
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
      
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Quiz</h2>
          <p className="text-gray-600">Test your knowledge and track your progress</p>
        </div>
        <div className="flex items-center space-x-4">
          {timerEnabled && (
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-full font-semibold ${
              timeRemaining <= 300 // 5 minutes
                ? 'bg-red-100 text-red-700 border border-red-200'
                : timeRemaining <= 600 // 10 minutes
                ? 'bg-orange-100 text-orange-700 border border-orange-200'
                : 'bg-purple-100 text-purple-700 border border-purple-200'
            }`}>
              <Clock className="h-5 w-5" />
              <span>{formatTime(timeRemaining)}</span>
            </div>
          )}
          <div className="text-lg font-semibold text-gray-700 bg-gray-100 px-4 py-2 rounded-full">
            {currentQuestionIndex + 1} / {questions.length}
          </div>
          <button
            onClick={resetQuiz}
            className="group p-4 bg-gradient-to-r from-purple-100 to-violet-200 hover:from-purple-200 hover:to-violet-300 rounded-2xl shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl"
          >
            <RotateCcw className="h-6 w-6 text-purple-600 group-hover:text-purple-800 group-hover:rotate-180 transition-all duration-300" />
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-br from-white to-purple-50/30 rounded-3xl shadow-2xl overflow-hidden border border-purple-100/50 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/10 to-indigo-50/10 rounded-3xl"></div>
        <div className="relative z-10">
        <div className="bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 px-8 py-8">
          <div className="w-full bg-white/20 rounded-full h-3 mb-6">
            <div 
              className="bg-gradient-to-r from-yellow-400 to-orange-400 h-3 rounded-full transition-all duration-500 shadow-lg"
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
          <div className="flex items-center justify-between mb-6">
            <div className="group flex items-center space-x-4 px-8 py-4 bg-white/95 backdrop-blur-md hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl shadow-xl border border-white/30 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
              <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full group-hover:scale-110 transition-transform duration-200">
                <span className="text-white font-bold text-lg">Q{currentQuestionIndex + 1}</span>
              </div>
              <span className="text-gray-700 font-semibold">Question {currentQuestionIndex + 1} of {questions.length}</span>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-white leading-relaxed">
            {currentQuestion.question}
          </h3>
        </div>

        <div className="p-8">
          <div className="space-y-4">
            {currentQuestion.options.map((option, index) => {
              const isSelected = userAnswer === index;
              const isCorrect = index === currentQuestion.correctAnswer;
              const showCorrect = showResults && isCorrect;
              const showIncorrect = showResults && isSelected && !isCorrect;

              return (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={showResults}
                  className={`
                    w-full text-left p-6 rounded-2xl border-2 transition-all duration-300 font-medium
                    ${showCorrect 
                      ? 'border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 text-green-800 shadow-lg' 
                      : showIncorrect
                      ? 'border-red-500 bg-gradient-to-r from-red-50 to-pink-50 text-red-800 shadow-lg'
                      : isSelected
                      ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-violet-50 text-purple-800 shadow-lg'
                      : 'border-gray-200 hover:border-purple-300 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-violet-50/30 hover:shadow-md hover:scale-102'
                    }
                    ${showResults ? 'cursor-default' : 'cursor-pointer'}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <span className="flex-1">{option}</span>
                    {showResults && (
                      <div className="ml-3">
                        {isCorrect ? (
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        ) : isSelected ? (
                          <XCircle className="h-6 w-6 text-red-600" />
                        ) : null}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {showResults && (
            <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-md rounded-2xl px-4 py-2 shadow-lg border border-white/30 animate-bounce">
              <span className="text-sm font-semibold text-gray-700">Scroll down for explanation</span>
            </div>
          )}

          {showResults && (
            <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200/50 rounded-2xl shadow-lg">
              <h4 className="font-bold text-purple-900 mb-3 text-lg">Explanation</h4>
              <p className="text-purple-800 leading-relaxed">{currentQuestion.explanation}</p>
            </div>
          )}

          <div className="mt-10 flex justify-between items-center">
            {!showResults && isAnswered ? (
              <button
                onClick={showAnswer}
                className="px-8 py-3 bg-white hover:bg-gray-50 text-gray-700 rounded-xl shadow-lg border border-gray-200 transition-all duration-200 hover:scale-105 font-semibold"
              >
                Show Answer
              </button>
            ) : (
              <div></div>
            )}

            {showResults && (
              <button
                onClick={handleNext}
                className="flex items-center space-x-3 px-8 py-3 bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-700 hover:via-violet-700 hover:to-indigo-700 text-white rounded-xl shadow-lg transition-all duration-200 hover:scale-105 ml-auto font-semibold"
              >
                <span>{currentQuestionIndex === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}</span>
                <ArrowRight className="h-6 w-6" />
              </button>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default QuizInterface;