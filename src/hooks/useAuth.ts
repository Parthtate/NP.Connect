import { useState, useEffect } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabaseClient';
import { User, UserRole } from '../../types';

interface AuthState {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

export function useAuth(): AuthState & AuthActions {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    supabaseUser: null,
    session: null,
    loading: true,
    error: null,
  });

  // Fetch user profile from profiles table
  const fetchUserProfile = async (userId: string): Promise<User | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      if (data) {
        return {
          id: data.id,
          name: data.full_name || data.email,
          email: data.email,
          role: data.role as UserRole,
          employeeId: data.employee_id,
          avatarUrl: data.avatar_url,
        };
      }

      return null;
    } catch (error) {
      console.error('Exception fetching profile:', error);
      return null;
    }
  };

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error getting session:', error);
          if (mounted) {
            setAuthState(prev => ({ ...prev, loading: false, error: error.message }));
          }
          return;
        }

        if (session?.user) {
          const userProfile = await fetchUserProfile(session.user.id);
          if (mounted) {
            setAuthState({
              user: userProfile,
              supabaseUser: session.user,
              session,
              loading: false,
              error: null,
            });
          }
        } else {
          if (mounted) {
            setAuthState({
              user: null,
              supabaseUser: null,
              session: null,
              loading: false,
              error: null,
            });
          }
        }
      } catch (error: any) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setAuthState({
            user: null,
            supabaseUser: null,
            session: null,
            loading: false,
            error: error.message,
          });
        }
      }
    };

    initAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const userProfile = await fetchUserProfile(session.user.id);
          if (mounted) {
            setAuthState({
              user: userProfile,
              supabaseUser: session.user,
              session,
              loading: false,
              error: null,
            });
          }
        } else {
          if (mounted) {
            setAuthState({
              user: null,
              supabaseUser: null,
              session: null,
              loading: false,
              error: null,
            });
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setAuthState(prev => ({ ...prev, loading: false, error: error.message }));
        return { success: false, error: error.message };
      }

      // Profile will be loaded by auth state change listener
      return { success: true };
    } catch (error: any) {
      const errorMessage = error.message || 'Login failed';
      setAuthState(prev => ({ ...prev, loading: false, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
      setAuthState({
        user: null,
        supabaseUser: null,
        session: null,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('Logout error:', error);
      setAuthState(prev => ({ ...prev, error: error.message }));
    }
  };

  // Refresh session
  const refreshSession = async (): Promise<void> => {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Error refreshing session:', error);
        return;
      }

      if (session?.user) {
        const userProfile = await fetchUserProfile(session.user.id);
        setAuthState({
          user: userProfile,
          supabaseUser: session.user,
          session,
          loading: false,
          error: null,
        });
      }
    } catch (error: any) {
      console.error('Session refresh error:', error);
    }
  };

  return {
    ...authState,
    login,
    logout,
    refreshSession,
  };
}
