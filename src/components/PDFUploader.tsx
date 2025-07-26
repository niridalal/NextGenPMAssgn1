import React, { useCallback } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';

interface PDFUploaderProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
  processingStep?: string;
  processingProgress?: number;
  error: string | null;
}

const PDFUploader: React.FC<PDFUploaderProps> = ({ 
  onFileSelect, 
  isProcessing, 
  processingStep = '',
  processingProgress = 0,
  error 
}) => {
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const pdfFile = files.find(file => file.type === 'application/pdf');
    
    if (pdfFile) {
      onFileSelect(pdfFile);
    }
  }, [onFileSelect]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      onFileSelect(file);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className={`
          relative border-2 border-dashed rounded-3xl p-16 text-center transition-all duration-300
          ${isProcessing 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/50'
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
        
        <div className="flex flex-col items-center space-y-6">
          {isProcessing ? (
            <>
              <div className="w-full max-w-md">
                {/* Animated skeleton loader */}
                <div className="space-y-4 mb-8">
                  <div className="flex items-center space-x-4">
                    <div className="animate-pulse bg-gradient-to-r from-blue-200 to-blue-300 rounded-full h-12 w-12"></div>
                    <div className="flex-1 space-y-2">
                      <div className="animate-pulse bg-gradient-to-r from-gray-200 to-gray-300 rounded h-4 w-3/4"></div>
                      <div className="animate-pulse bg-gradient-to-r from-gray-200 to-gray-300 rounded h-3 w-1/2"></div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="animate-pulse bg-gradient-to-r from-gray-200 to-gray-300 rounded h-3 w-full"></div>
                    <div className="animate-pulse bg-gradient-to-r from-gray-200 to-gray-300 rounded h-3 w-5/6"></div>
                    <div className="animate-pulse bg-gradient-to-r from-gray-200 to-gray-300 rounded h-3 w-4/5"></div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <div className="animate-pulse bg-gradient-to-r from-blue-200 to-blue-300 rounded-lg h-8 w-20"></div>
                    <div className="animate-pulse bg-gradient-to-r from-green-200 to-green-300 rounded-lg h-8 w-24"></div>
                    <div className="animate-pulse bg-gradient-to-r from-purple-200 to-purple-300 rounded-lg h-8 w-16"></div>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-700">Processing...</span>
                    <span className="text-sm font-bold text-blue-700">{processingProgress}%</span>
                  </div>
                  <div className="w-full bg-blue-100 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out relative overflow-hidden"
                      style={{ width: `${processingProgress}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                    </div>
                  </div>
                </div>
                
                {/* Status text */}
                <div className="text-center">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {processingStep || 'Processing PDF with AI...'}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {processingProgress < 40 ? 'Extracting and analyzing document content...' :
                     processingProgress < 80 ? 'Generating intelligent learning materials...' :
                     processingProgress < 100 ? 'Finalizing flashcards and quiz questions...' :
                     'Ready to start learning!'}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="p-6 bg-blue-100 rounded-full">
                <Upload className="h-16 w-16 text-blue-600" />
              </div>
              <div>
                <h3 className="text-3xl font-bold text-gray-900 mb-3">
                  Upload your PDF
                </h3>
                <p className="text-lg text-gray-600 mb-6">
                  Drop your PDF here or click to browse
                </p>
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                  <FileText className="h-4 w-4" />
                  <span>PDF files only • Max 50MB</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      
      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFUploader;