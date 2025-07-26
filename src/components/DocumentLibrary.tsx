import React, { useState, useEffect } from 'react';
import { FileText, Download, Trash2, Calendar, Eye, BookOpen, Brain, Search, Filter, Grid, List } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

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

interface DocumentLibraryProps {
  user: User;
  onDocumentSelect?: (document: Document) => void;
}

const DocumentLibrary: React.FC<DocumentLibraryProps> = ({ user, onDocumentSelect }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('date');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, [user]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch documents with flashcard and quiz counts
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

      // Filter to keep only unique documents (by filename), keeping the latest updated version
      const uniqueDocuments = (docsData || []).reduce((acc, doc) => {
        const existingDoc = acc.find(existing => existing.filename === doc.filename);
        if (!existingDoc) {
          acc.push(doc);
        } else {
          // Keep the document with the latest updated_at timestamp
          const existingUpdated = new Date(existingDoc.updated_at).getTime();
          const currentUpdated = new Date(doc.updated_at).getTime();
          if (currentUpdated > existingUpdated) {
            const index = acc.findIndex(existing => existing.filename === doc.filename);
            acc[index] = doc;
          }
        }
        return acc;
      }, [] as typeof docsData);

      // Get flashcard and quiz counts for each document
      const documentsWithCounts = await Promise.all(
        uniqueDocuments.map(async (doc) => {
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
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document? This will also delete all associated flashcards and quiz questions.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('pdfs')
        .delete()
        .eq('id', documentId)
        .eq('user_id', user.id);

      if (error) throw error;

      setDocuments(docs => docs.filter(doc => doc.id !== documentId));
      setSelectedDocuments(selected => selected.filter(id => id !== documentId));
    } catch (error: any) {
      console.error('Error deleting document:', error);
      setError(error.message);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedDocuments.length === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedDocuments.length} document(s)? This will also delete all associated flashcards and quiz questions.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('pdfs')
        .delete()
        .in('id', selectedDocuments)
        .eq('user_id', user.id);

      if (error) throw error;

      setDocuments(docs => docs.filter(doc => !selectedDocuments.includes(doc.id)));
      setSelectedDocuments([]);
    } catch (error: any) {
      console.error('Error deleting documents:', error);
      setError(error.message);
    }
  };

  const filteredAndSortedDocuments = documents
    .filter(doc => 
      doc.filename.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.filename.localeCompare(b.filename);
        case 'date':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'size':
          return b.page_count - a.page_count;
        default:
          return 0;
      }
    });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (pageCount: number) => {
    return `${pageCount} page${pageCount !== 1 ? 's' : ''}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your documents...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl max-w-md mx-auto">
          <p className="text-red-700 font-medium">Error loading documents: {error}</p>
          <button
            onClick={fetchDocuments}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Document Library</h2>
          <p className="text-gray-600">Manage your uploaded PDF documents and learning materials</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl px-6 py-3 shadow-lg border border-white/30">
            <span className="text-2xl font-bold text-purple-600">{documents.length}</span>
            <span className="text-gray-600 ml-2">Documents</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
          />
        </div>

        <div className="flex items-center space-x-4">
          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'date' | 'size')}
            className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
          >
            <option value="date">Sort by Date</option>
            <option value="name">Sort by Name</option>
            <option value="size">Sort by Size</option>
          </select>

          {/* View Mode */}
          <div className="flex items-center bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all duration-200 ${
                viewMode === 'grid' 
                  ? 'bg-white shadow-sm text-purple-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Grid className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all duration-200 ${
                viewMode === 'list' 
                  ? 'bg-white shadow-sm text-purple-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <List className="h-5 w-5" />
            </button>
          </div>

          {/* Bulk Actions */}
          {selectedDocuments.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center space-x-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all duration-200"
            >
              <Trash2 className="h-5 w-5" />
              <span>Delete ({selectedDocuments.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Documents */}
      {filteredAndSortedDocuments.length === 0 ? (
        <div className="text-center py-20">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-indigo-500 rounded-full blur-2xl opacity-20"></div>
            <div className="relative p-8 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-full inline-block">
              <FileText className="h-20 w-20 text-purple-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            {searchTerm ? 'No documents found' : 'No documents yet'}
          </h3>
          <p className="text-lg text-gray-600 max-w-md mx-auto">
            {searchTerm 
              ? `No documents match "${searchTerm}". Try a different search term.`
              : 'Upload your first PDF document to start building your learning library.'
            }
          </p>
        </div>
      ) : (
        <div className={`
          ${viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
            : 'space-y-4'
          }
        `}>
          {filteredAndSortedDocuments.map((document) => (
            <div
              key={document.id}
              className={`
                bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-white/30 transition-all duration-300 hover:shadow-xl hover:scale-102
                ${viewMode === 'list' ? 'flex items-center p-6' : 'p-6'}
              `}
            >
              {viewMode === 'grid' ? (
                <>
                  {/* Grid View */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-xl">
                      <FileText className="h-8 w-8 text-purple-600" />
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedDocuments.includes(document.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedDocuments([...selectedDocuments, document.id]);
                        } else {
                          setSelectedDocuments(selectedDocuments.filter(id => id !== document.id));
                        }
                      }}
                      className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                    />
                  </div>
                  
                  <h3 className="font-bold text-gray-900 mb-2 line-clamp-2" title={document.filename}>
                    {document.filename}
                  </h3>
                  
                  <div className="space-y-2 mb-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(document.created_at)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4" />
                      <span>{formatFileSize(document.page_count)}</span>
                    </div>
                  </div>

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

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onDocumentSelect?.(document)}
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg transition-all duration-200 text-sm font-medium"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View</span>
                    </button>
                    <button
                      onClick={() => handleDeleteDocument(document.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* List View */}
                  <input
                    type="checkbox"
                    checked={selectedDocuments.includes(document.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedDocuments([...selectedDocuments, document.id]);
                      } else {
                        setSelectedDocuments(selectedDocuments.filter(id => id !== document.id));
                      }
                    }}
                    className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 mr-4"
                  />
                  
                  <div className="p-3 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-xl mr-4">
                    <FileText className="h-6 w-6 text-purple-600" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 mb-1 truncate" title={document.filename}>
                      {document.filename}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>{formatDate(document.created_at)}</span>
                      <span>{formatFileSize(document.page_count)}</span>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1 text-purple-600">
                          <BookOpen className="h-4 w-4" />
                          <span>{document.flashcard_count || 0}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-indigo-600">
                          <Brain className="h-4 w-4" />
                          <span>{document.quiz_count || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => onDocumentSelect?.(document)}
                      className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg transition-all duration-200 text-sm font-medium"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View</span>
                    </button>
                    <button
                      onClick={() => handleDeleteDocument(document.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentLibrary;