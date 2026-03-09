import { createClient } from '@supabase/supabase-client';

// For Vite projects, you MUST use import.meta.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("API Keys are missing! Check Vercel Settings.");
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');