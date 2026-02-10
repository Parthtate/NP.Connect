import React, { useState } from 'react';
import { Mail, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export const MagicLinkLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send magic link');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 to-slate-800 flex flex-col justify-center items-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl overflow-hidden p-10 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <CheckCircle className="text-green-600 w-10 h-10" />
          </div>
          <h2 className="text-3xl font-bold text-black mb-3">Check Your Email</h2>
          <p className="text-slate-600 mb-6 text-base">
            We've sent a magic link to <strong className="text-black">{email}</strong>
          </p>
          <p className="text-sm text-slate-500 mb-8 bg-slate-50 p-4 rounded-xl border border-slate-200">
            Click the link in your email to sign in. The link will expire in 1 hour.
          </p>
          <button
            onClick={() => {
              setSent(false);
              setEmail('');
            }}
            className="text-blue-600 hover:text-blue-700 hover:underline text-sm font-semibold transition-colors"
          >
            Use a different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 to-slate-800 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden">
        {/* Header with Logo */}
        <div className="bg-white p-8 text-center">
          {/* Company Logo */}
          <div className="flex justify-center">
            <div className="bg-white rounded-2xl p-4">
              <img 
                src="/nppmt-logo.jpeg" 
                alt="NPPMT Logo" 
                className="w-30 h-20 object-contain"
              />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-black tracking-tight">Passwordless Login</h3>
          <p className="text-black mt-2 text-sm">Enter your email to receive a magic link</p>
        </div>

        {/* Form */}
        <div className="p-8">
          <form onSubmit={handleSendMagicLink} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm bg-white text-slate-900 placeholder-slate-400"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-red-500 text-xs flex items-center gap-1 bg-red-50 p-2 rounded">
                <AlertCircle size={12} />
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  <Mail size={16} />
                  Send Magic Link
                </>
              )}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">or</span>
              </div>
            </div>
            <p className="mt-4 text-center text-sm text-slate-600">
              Admin or HR?{' '}
              <a
                href="/login"
                className="text-blue-600 hover:underline font-medium"
              >
                Use password login
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MagicLinkLogin;
