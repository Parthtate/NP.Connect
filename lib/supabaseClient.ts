import { createClient } from '@supabase/supabase-js';

// Helper to safely retrieve environment variables
// This prevents "Cannot read properties of undefined" if import.meta.env is missing
const getEnvVar = (viteKey: string, nextKey: string) => {
  let value = '';

  // 1. Try Vite (import.meta.env)
  // We check if 'env' exists on import.meta before accessing properties
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      value = (import.meta as any).env[viteKey] || '';
    }
  } catch (e) {
    // Ignore errors in environments where import.meta is not supported
  }

  // 2. Try Next.js / Node (process.env)
  // We check if 'process' is defined to avoid ReferenceErrors
  if (!value) {
    try {
      if (typeof process !== 'undefined' && process.env) {
        value = process.env[nextKey] || '';
      }
    } catch (e) {
      // Ignore errors
    }
  }

  return value;
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Please create a .env file with your credentials.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);