import React from 'react';
import { BookOpen, Brain, Clock, TrendingUp } from 'lucide-react';
import { PDFProgress } from '../types';

interface ProgressTrackerProps {
  progressData: PDFProgress[];
  onSelectPDF: (pdfId: string) => void;
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({ progressData, onSelectPDF }) => {
  const calculateOverallProgress = (progress: PDFProgress) => {
    const totalItems = progress.flashcardsTotal + progress.quizTotal;
    const completedItems = progress.flashcardsCompleted + progress.quizCompleted;
    return totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600 bg-green-100';
    if (percentage >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-blue-600 bg-blue-100';
  };

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (progressData.length === 0) {
    return (
      <div className="text-center py-20">
        <TrendingUp className="h-20 w-20 text-gray-400 mx-auto mb-6" />
        <h3 className="text-2xl font-bold text-gray-900 mb-3">No PDFs in Progress</h3>
        <p className="text-gray-600 mb-6">
          Upload your first PDF to start learning and track your progress.
        </p>
        <div className="text-sm text-gray-500">
          Your learning progress will appear here once you start studying.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Your Learning Progress</h2>
        <p className="text-gray-600">Continue where you left off</p>
      </div>

      <div className="grid gap-6">
        {progressData.map((progress) => {
          const overallProgress = calculateOverallProgress(progress);
          const flashcardProgress = progress.flashcardsTotal > 0 
            ? Math.round((progress.flashcardsCompleted / progress.flashcardsTotal) * 100) 
            : 0;
          const quizProgress = progress.quizTotal > 0 
            ? Math.round((progress.quizCompleted / progress.quizTotal) * 100) 
            : 0;

          return (
            <div
              key={progress.id}
              onClick={() => onSelectPDF(progress.id)}
              className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-102 border border-gray-100"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 truncate">
                      {progress.filename}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>Last accessed {formatDate(progress.lastAccessed)}</span>
                      </div>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getProgressColor(overallProgress)}`}>
                    {overallProgress}% Complete
                  </div>
                </div>

                {/* Overall Progress Bar */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                    <span className="text-sm font-bold text-gray-900">{overallProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-500 ${getProgressBarColor(overallProgress)}`}
                      style={{ width: `${overallProgress}%` }}
                    />
                  </div>
                </div>

                {/* Detailed Progress */}
                <div className="grid grid-cols-2 gap-6">
                  {/* Flashcards Progress */}
                  <div className="bg-blue-50 rounded-xl p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <BookOpen className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Flashcards</h4>
                        <p className="text-sm text-gray-600">
                          {progress.flashcardsCompleted} of {progress.flashcardsTotal}
                        </p>
                      </div>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${flashcardProgress}%` }}
                      />
                    </div>
                    <div className="text-right mt-1">
                      <span className="text-sm font-bold text-blue-700">{flashcardProgress}%</span>
                    </div>
                  </div>

                  {/* Quiz Progress */}
                  <div className="bg-indigo-50 rounded-xl p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="p-2 bg-indigo-100 rounded-lg">
                        <Brain className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Quiz</h4>
                        <p className="text-sm text-gray-600">
                          {progress.quizCompleted} of {progress.quizTotal}
                        </p>
                      </div>
                    </div>
                    <div className="w-full bg-indigo-200 rounded-full h-2">
                      <div 
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${quizProgress}%` }}
                      />
                    </div>
                    <div className="text-right mt-1">
                      <span className="text-sm font-bold text-indigo-700">{quizProgress}%</span>
                    </div>
                  </div>
                </div>

                {/* Action Hint */}
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-500">Click to continue learning</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressTracker;