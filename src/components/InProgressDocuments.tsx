import React from 'react';
import { FileText, Clock, BookOpen, Brain, Play, RotateCcw, ChevronRight, Trophy } from 'lucide-react';

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

interface DocumentProgress {
  tab: 'flashcards' | 'quiz';
  index: number;
}

interface InProgressDocumentsProps {
  documents: Document[];
  documentProgress: {[key: string]: DocumentProgress};
  onDocumentSelect: (document: Document) => void;
}

const InProgressDocuments: React.FC<InProgressDocumentsProps> = ({
  documents,
  documentProgress,
  onDocumentSelect
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getProgressInfo = (document: Document) => {
    const progress = documentProgress[document.id];
    if (!progress) {
      return {
        status: 'Not Started',
        description: 'Ready to begin learning',
        icon: Play,
        color: 'text-gray-500',
        bgColor: 'bg-gray-100',
        progress: 0
      };
    }

    const total = progress.tab === 'flashcards' ? document.flashcard_count || 0 : document.quiz_count || 0;
    const current = progress.index + 1;
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

    if (percentage >= 100) {
      return {
        status: `${progress.tab === 'flashcards' ? 'Flashcards' : 'Quiz'} Complete`,
        description: `Finished all ${total} ${progress.tab === 'flashcards' ? 'flashcards' : 'questions'}`,
        icon: Trophy,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        progress: 100
      };
    }

    return {
      status: `${progress.tab === 'flashcards' ? 'Studying Flashcards' : 'Taking Quiz'}`,
      description: `${current} of ${total} ${progress.tab === 'flashcards' ? 'flashcards' : 'questions'} (${percentage}%)`,
      icon: progress.tab === 'flashcards' ? BookOpen : Brain,
      color: progress.tab === 'flashcards' ? 'text-purple-600' : 'text-indigo-600',
      bgColor: progress.tab === 'flashcards' ? 'bg-purple-100' : 'bg-indigo-100',
      progress: percentage
    };
  };

  if (documents.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-teal-500 rounded-full blur-2xl opacity-20"></div>
          <div className="relative p-8 bg-gradient-to-r from-green-100 to-teal-100 rounded-full inline-block">
            <Clock className="h-20 w-20 text-green-600" />
          </div>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-3">No Documents in Progress</h3>
        <p className="text-lg text-gray-600 max-w-md mx-auto">
          Upload a PDF document to start learning and track your progress here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl blur-lg opacity-40 animate-pulse"></div>
            <div className="relative p-4 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 rounded-2xl shadow-xl">
              <Clock className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>
        
        <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-green-800 to-teal-900 bg-clip-text text-transparent mb-4">
          Documents in Progress
        </h2>
        <p className="text-xl text-gray-600 mb-6">Continue learning from where you left off</p>
        
        {/* Stats */}
        <div className="flex items-center justify-center space-x-6 mb-8">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl px-6 py-4 shadow-lg border border-white/30">
            <div className="text-2xl font-bold text-green-600">{documents.length}</div>
            <div className="text-sm text-gray-600 font-medium">Documents</div>
          </div>
          <div className="bg-white/95 backdrop-blur-md rounded-2xl px-6 py-4 shadow-lg border border-white/30">
            <div className="text-2xl font-bold text-teal-600">
              {Object.keys(documentProgress).length}
            </div>
            <div className="text-sm text-gray-600 font-medium">In Progress</div>
          </div>
          <div className="bg-white/95 backdrop-blur-md rounded-2xl px-6 py-4 shadow-lg border border-white/30">
            <div className="text-2xl font-bold text-emerald-600">
              {Object.values(documentProgress).filter(p => {
                const doc = documents.find(d => documentProgress[d.id] === p);
                if (!doc) return false;
                const total = p.tab === 'flashcards' ? doc.flashcard_count || 0 : doc.quiz_count || 0;
                return ((p.index + 1) / total) >= 1;
              }).length}
            </div>
            <div className="text-sm text-gray-600 font-medium">Completed</div>
          </div>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documents.map((document) => {
          const progressInfo = getProgressInfo(document);
          const ProgressIcon = progressInfo.icon;
          
          return (
            <button
              key={document.id}
              onClick={() => onDocumentSelect(document)}
              className="group p-6 bg-white/95 backdrop-blur-md hover:bg-white border border-white/30 hover:border-green-300 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-left hover:scale-102"
            >
              {/* Document Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gradient-to-r from-green-100 to-teal-100 rounded-xl group-hover:from-green-200 group-hover:to-teal-200 transition-colors">
                  <FileText className="h-8 w-8 text-green-600" />
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-green-600 transition-colors" />
              </div>
              
              {/* Document Info */}
              <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-green-900 transition-colors" title={document.filename}>
                {document.filename}
              </h3>
              
              <div className="space-y-2 mb-4 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>{formatDate(document.created_at)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>{document.page_count} pages</span>
                </div>
              </div>

              {/* Learning Materials Count */}
              <div className="flex items-center space-x-4 mb-4 text-sm">
                <div className="flex items-center space-x-1 text-purple-600">
                  <BookOpen className="h-4 w-4" />
                  <span>{document.flashcard_count || 0}</span>
                </div>
                <div className="flex items-center space-x-1 text-indigo-600">
                  <Brain className="h-4 w-4" />
                  <span>{document.quiz_count || 0}</span>
                </div>
              </div>

              {/* Progress Section */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`p-2 ${progressInfo.bgColor} rounded-lg`}>
                    <ProgressIcon className={`h-4 w-4 ${progressInfo.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-semibold ${progressInfo.color}`}>
                      {progressInfo.status}
                    </div>
                    <div className="text-xs text-gray-500">
                      {progressInfo.description}
                    </div>
                  </div>
                </div>
                
                {/* Progress Bar */}
                {progressInfo.progress > 0 && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${
                        progressInfo.progress >= 100 
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
                          : 'bg-gradient-to-r from-green-400 to-teal-500'
                      }`}
                      style={{ width: `${progressInfo.progress}%` }}
                    ></div>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default InProgressDocuments;