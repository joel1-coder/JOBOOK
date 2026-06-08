import { createClient } from '@supabase/supabase-js';
import { mockSupabase } from './mockSupabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const urlPattern = /^https:\/\/[A-Za-z0-9-]+\.supabase\.co\/?$/;
const missingEnv = !supabaseUrl || !supabaseAnonKey;
const invalidUrl = supabaseUrl && !urlPattern.test(supabaseUrl);

// Check if we should use the mock client for development
const useMock = import.meta.env.VITE_USE_MOCK_SUPABASE === 'true' || missingEnv || invalidUrl;

if (useMock) {
  console.log('🔌 [JOBOOK] Using Mock Local Supabase Client (localStorage)');
} else if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️  Missing Supabase env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env');
} else if (invalidUrl) {
  console.error(`⚠️  Invalid Supabase URL: ${supabaseUrl}`);
}

export const supabase = useMock ? mockSupabase : createClient(supabaseUrl, supabaseAnonKey);
