import { createClient } from '@supabase/supabase-js';

// For Vite projects, you MUST use import.meta.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("API Keys are missing! Check Vercel Settings.");
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');