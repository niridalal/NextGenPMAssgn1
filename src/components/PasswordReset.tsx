import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Key, CheckCircle, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';

const PasswordReset: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [validatingToken, setValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);

  useEffect(() => {
    const handlePasswordReset = async () => {
      console.log('Password reset page loaded');
      console.log('Current URL:', window.location.href);
      console.log('Hash:', window.location.hash);
      
      const getUrlParams = () => {
        // Check for hash fragment first (Supabase default)
        if (window.location.hash) {
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          console.log('Hash params:', Object.fromEntries(hashParams.entries()));
          return {
            access_token: hashParams.get('access_token'),
            refresh_token: hashParams.get('refresh_token'),
            type: hashParams.get('type'),
            error: hashParams.get('error'),
            error_description: hashParams.get('error_description')
          };
        }
        
        // Fallback to query parameters
        const searchParams = new URLSearchParams(window.location.search);
        console.log('Search params:', Object.fromEntries(searchParams.entries()));
        return {
          access_token: searchParams.get('access_token'),
          refresh_token: searchParams.get('refresh_token'),
          type: searchParams.get('type'),
          error: searchParams.get('error'),
          error_description: searchParams.get('error_description')
        };
      };

      const params = getUrlParams();
      console.log('Extracted params:', params);
      
      // Check for errors first
      if (params.error) {
        console.log('Error detected:', params.error, params.error_description);
        let errorMessage = 'Invalid or expired reset link.';
        
        if (params.error === 'access_denied') {
          if (params.error_description?.includes('expired')) {
            errorMessage = 'This password reset link has expired. Please request a new one.';
          } else if (params.error_description?.includes('invalid')) {
            errorMessage = 'This password reset link is invalid. Please request a new one.';
          }
        }
        
        setError(errorMessage);
        setValidatingToken(false);
        return;
      }

      if (params.type === 'recovery' && params.access_token && params.refresh_token) {
        console.log('Valid recovery tokens found, setting session...');
        try {
          const { error } = await supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token,
          });

          if (error) {
            console.error('Session error:', error);
            if (error.message.includes('expired')) {
              setError('This password reset link has expired. Please request a new password reset.');
            } else {
              setError('Invalid reset link. Please request a new password reset.');
            }
          } else {
            console.log('Session set successfully');
            setTokenValid(true);
            // Clear the URL to remove tokens from browser history
            window.history.replaceState({}, document.title, '/reset-password');
          }
        } catch (err) {
          console.error('Unexpected error:', err);
          setError('Invalid or expired reset link. Please request a new password reset.');
        }
      } else {
        console.log('Missing required parameters:', params);
        setError('Invalid reset link. Please request a new password reset.');
      }
      
      setValidatingToken(false);
    };

    handlePasswordReset();
  }, []);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validation
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        throw error;
      }

      setSuccess(true);
      
      // Sign out after successful password reset
      setTimeout(async () => {
        await supabase.auth.signOut();
        window.location.href = '/';
      }, 3000);

    } catch (error: any) {
      setError(error.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToSignIn = () => {
    window.location.href = '/';
  };

  if (validatingToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Validating reset link...</p>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-red-500 to-pink-600 rounded-2xl mb-4">
                <AlertCircle className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Invalid Reset Link
              </h1>
              <p className="text-gray-600 mb-6">
                {error || 'This password reset link is invalid or has expired.'}
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-blue-800 text-sm">
                  <strong>Need a new reset link?</strong> Go back to the sign-in page and click "Forgot your password?" to request a new one.
                </p>
              </div>
              
              <button
                onClick={handleBackToSignIn}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl mb-4">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Password Reset Successful
              </h1>
              <p className="text-gray-600 mb-6">
                Your password has been successfully updated. You'll be redirected to the sign-in page shortly.
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                <p className="text-green-800 text-sm">
                  <strong>Success!</strong> You can now sign in with your new password.
                </p>
              </div>
              
              <button
                onClick={handleBackToSignIn}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200"
              >
                Go to Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mb-4">
              <Key className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Set New Password
            </h1>
            <p className="text-gray-600">
              Enter your new password below
            </p>
          </div>

          <form onSubmit={handlePasswordReset} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters long</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Key className="h-5 w-5" />
                  <span>Update Password</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={handleBackToSignIn}
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordReset;