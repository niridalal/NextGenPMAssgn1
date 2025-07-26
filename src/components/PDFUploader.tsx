import React, { useCallback } from 'react';
import { Upload, FileText, AlertCircle, Loader2 } from 'lucide-react';

interface PDFUploaderProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
  error: string | null;
}

const PDFUploader: React.FC<PDFUploaderProps> = ({ 
  onFileSelect, 
  isProcessing, 
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
              <Loader2 className="h-16 w-16 text-blue-600 animate-spin" />
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Processing PDF with AI...
                </h3>
                <p className="text-gray-600">
                  Analyzing content and generating intelligent flashcards and quiz questions
                </p>
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
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFUploader;