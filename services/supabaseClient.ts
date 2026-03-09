/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-client';

// Vite requires the VITE_ prefix to expose variables to the browser
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');