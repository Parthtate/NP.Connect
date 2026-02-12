import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your login...');

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      // Get session from URL hash
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;
      if (!session) throw new Error('No session found');

      // Check if user has a profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      // If no profile, create one by matching email to employee
      if (!profile) {
        const { data: employee, error: employeeError } = await supabase
          .from('employees')
          .select('*')
          .eq('email', session.user.email)
          .single();

        if (employeeError) {
          throw new Error('No employee record found for this email. Please contact HR.');
        }

        // Create profile
        const { error: createProfileError } = await supabase
          .from('profiles')
          .insert({
            id: session.user.id,
            email: session.user.email,
            full_name: employee.full_name,
            role: employee.role || 'EMPLOYEE',
            onboarding_completed: false,
            first_login_at: new Date().toISOString(),
          });

        if (createProfileError) throw createProfileError;
      }

      setStatus('success');
      setMessage('Login successful! Redirecting...');

      // Redirect to main app
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 1500);
    } catch (err: any) {
      console.error('Auth callback error:', err);
      setStatus('error');
      setMessage(err.message || 'Authentication failed');

      // Redirect to login after error
      setTimeout(() => {
        navigate('/magic-link', { replace: true });
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="animate-spin text-blue-600 mx-auto mb-4" size={48} />
            <p className="text-slate-700 font-medium">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="text-green-600 w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Welcome!</h2>
            <p className="text-slate-600">{message}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <AlertCircle className="text-red-600 w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Authentication Failed</h2>
            <p className="text-slate-600 mb-4">{message}</p>
            <p className="text-sm text-slate-500">Redirecting to login...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
