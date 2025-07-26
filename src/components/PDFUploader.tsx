import React, { useCallback } from 'react';
import { Upload, FileText, AlertCircle, Brain, Zap, Clock, ChevronRight } from 'lucide-react';

interface PDFUploaderProps {
  onFileSelect: (file: File) => void;
  onDocumentSelect?: (document: any) => void;
  isProcessing: boolean;
  processingStage: string;
  processingProgress: number;
  error: string | null;
}

const PDFUploader: React.FC<PDFUploaderProps> = ({ 
  onFileSelect, 
  isProcessing, 
  processingStage, 
  processingProgress, 
  error 
}) => {
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const pdfFile = files.find(file => file.type === 'application/pdf');
    
    if (pdfFile) {
      onFileSelect(pdfFile);
    } else if (files.length > 0) {
      // Show error for non-PDF files
      console.warn('Only PDF files are supported');
    }
  }, [onFileSelect]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      onFileSelect(file);
    } else if (file) {
      // Reset the input to allow selecting the same file again
      e.target.value = '';
    }
  };

  const getStageIcon = () => {
    switch (processingStage) {
      case 'extracting':
        return <FileText className="h-8 w-8 text-blue-600" />;
      case 'generating':
        return <Brain className="h-8 w-8 text-purple-600" />;
      case 'saving':
        return <Zap className="h-8 w-8 text-green-600" />;
      default:
        return <FileText className="h-8 w-8 text-blue-600" />;
    }
  };

  const getStageMessage = () => {
    switch (processingStage) {
      case 'extracting':
        return 'Extracting text from PDF...';
      case 'generating':
        return 'Generating flashcards and quiz questions...';
      case 'saving':
        return 'Saving your learning materials...';
      default:
        return 'Processing PDF...';
    }
  };

  return (
    <>
      <div className="w-full max-w-3xl mx-auto">
      <div
        className={`
          relative border-2 border-dashed rounded-3xl p-16 text-center transition-all duration-500 group
          ${isProcessing 
            ? 'border-blue-400 bg-gradient-to-br from-blue-50 to-indigo-50' 
            : 'border-gray-300 hover:border-blue-400 hover:bg-gradient-to-br hover:from-blue-50/50 hover:to-indigo-50/30 hover:scale-102'
          }
        `}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isProcessing}
        />
        
        <div className="flex flex-col items-center space-y-4">
          {isProcessing ? (
            <>
              {/* Progress Circle */}
              <div className="relative w-32 h-32">
                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                  {/* Background circle */}
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-gray-200"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    className="text-blue-600 transition-all duration-500"
                    style={{
                      strokeDasharray: `${2 * Math.PI * 50}`,
                      strokeDashoffset: `${2 * Math.PI * 50 * (1 - processingProgress / 100)}`,
                    }}
                  />
                </svg>
                {/* Center content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="mb-2">
                    {getStageIcon()}
                  </div>
                  <div className="text-2xl font-bold text-gray-800">
                    {Math.round(processingProgress)}%
                  </div>
                </div>
              </div>

              {/* Processing message */}
              <div className="space-y-2">
                <p className="text-2xl font-bold text-gray-800 text-center">
                  {getStageMessage()}
                </p>
                <p className="text-gray-600 font-medium text-center max-w-md">
                  Creating personalized learning materials from your PDF
                </p>
              </div>

              {/* Skeleton Cards Preview */}
              <div className="mt-8 space-y-4 w-full max-w-2xl">
                <div className="text-center mb-4">
                  <p className="text-sm text-gray-500 font-medium">Preparing your learning materials...</p>
                </div>
                
                {/* Skeleton Flashcards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white/60 rounded-2xl p-6 border border-gray-200/50">
                      <div className="animate-pulse">
                        <div className="flex items-center justify-between mb-4">
                          <div className="h-4 bg-gray-200 rounded-full w-20"></div>
                          <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
                        </div>
                        <div className="space-y-3">
                          <div className="h-4 bg-gray-200 rounded w-full"></div>
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-center space-x-8 mt-8">
                  <div className={`flex items-center space-x-2 ${processingStage === 'extracting' ? 'text-blue-600' : processingProgress > 33 ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`w-3 h-3 rounded-full ${processingStage === 'extracting' ? 'bg-blue-600 animate-pulse' : processingProgress > 33 ? 'bg-green-600' : 'bg-gray-300'}`}></div>
                    <span className="text-sm font-medium">Extract</span>
                  </div>
                  <div className={`flex items-center space-x-2 ${processingStage === 'generating' ? 'text-purple-600' : processingProgress > 66 ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`w-3 h-3 rounded-full ${processingStage === 'generating' ? 'bg-purple-600 animate-pulse' : processingProgress > 66 ? 'bg-green-600' : 'bg-gray-300'}`}></div>
                    <span className="text-sm font-medium">Generate</span>
                  </div>
                  <div className={`flex items-center space-x-2 ${processingStage === 'saving' ? 'text-green-600' : processingProgress === 100 ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`w-3 h-3 rounded-full ${processingStage === 'saving' ? 'bg-green-600 animate-pulse' : processingProgress === 100 ? 'bg-green-600' : 'bg-gray-300'}`}></div>
                    <span className="text-sm font-medium">Save</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-3xl blur-lg opacity-20 group-hover:opacity-30 transition-opacity"></div>
                <div className="relative p-6 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-3xl group-hover:from-blue-200 group-hover:to-indigo-200 transition-all duration-300">
                  <Upload className="h-16 w-16 text-blue-600 group-hover:scale-110 transition-transform duration-300" />
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-bold text-gray-900 mb-3">
                  Upload your PDF
                </h3>
                <p className="text-lg text-gray-600 mb-8 max-w-lg mx-auto leading-relaxed">
                  Upload your PDF document to automatically generate interactive flashcards and quiz questions for enhanced learning
                </p>
                <div className="inline-flex items-center space-x-3 px-4 py-2 bg-gray-100 rounded-full">
                  <FileText className="h-5 w-5 text-gray-500" />
                  <span className="text-gray-600 font-medium">PDF files only • Max 50MB</span>
                </div>
                
                {/* Upload Instructions */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                  <div className="text-center p-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-blue-600 font-bold text-lg">1</span>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">Upload PDF</h4>
                    <p className="text-sm text-gray-600">Drag & drop or click to select your PDF document</p>
                  </div>
                  <div className="text-center p-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-purple-600 font-bold text-lg">2</span>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">AI Processing</h4>
                    <p className="text-sm text-gray-600">Our AI analyzes content and generates learning materials</p>
                  </div>
                  <div className="text-center p-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-green-600 font-bold text-lg">3</span>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">Start Learning</h4>
                    <p className="text-sm text-gray-600">Choose flashcards or quiz to begin studying</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      
      {error && (
        <div className="mt-6 p-6 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200/50 rounded-2xl shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <h4 className="font-semibold text-red-800 mb-1">Upload Error</h4>
              <div className="text-red-700">
                {error.includes('\n') ? (
                  <div className="space-y-2">
                    {error.split('\n').map((line, index) => (
                      <p key={index} className={line.startsWith('•') ? 'ml-4' : ''}>{line}</p>
                    ))}
                  </div>
                ) : (
                  <p>{error}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
      
    </>
  );
};

export default PDFUploader;