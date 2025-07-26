import React, { useState } from 'react';
import { BookOpen, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            {/* Header */}
            <div className="flex items-center justify-center mb-8">
              <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg">
                <BookOpen className="h-12 w-12 text-white" />
              </div>
            </div>
            
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              PDF Learning Assistant
            </h1>
            <p className="text-xl text-gray-600 mb-12">
              Transform your PDF documents into interactive flashcards and quizzes for better learning
            </p>

            {/* Auth Required Card */}
            <div className="bg-white rounded-3xl shadow-xl p-12 mb-8">
              <div className="p-6 bg-blue-100 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <Lock className="h-12 w-12 text-blue-600" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Sign In Required
              </h2>
              <p className="text-gray-600 mb-8">
                Please sign in to access your personalized learning materials and track your progress.
              </p>
              
              <div className="space-y-4">
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-200"
                >
                  Sign In to Continue
                </button>
                
                <p className="text-sm text-gray-500">
                  New to PDF Learning Assistant?{' '}
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    Create a free account
                  </button>
                </p>
              </div>
            </div>

            {/* Features */}
            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Smart Flashcards</h3>
                <p className="text-gray-600 text-sm">
                  AI-generated flashcards from your PDF content for effective studying
                </p>
              </div>
              
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
                  <BookOpen className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Interactive Quizzes</h3>
                <p className="text-gray-600 text-sm">
                  Test your knowledge with automatically generated quiz questions
                </p>
              </div>
              
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                  <BookOpen className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Progress Tracking</h3>
                <p className="text-gray-600 text-sm">
                  Monitor your learning progress and improve over time
                </p>
              </div>
            </div>
          </div>
        </div>

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthGuard;