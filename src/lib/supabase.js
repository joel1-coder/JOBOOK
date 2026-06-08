import { createClient } from '@supabase/supabase-js';
import { mockSupabase } from './mockSupabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const urlPattern = /^https:\/\/[A-Za-z0-9-]+\.supabase\.co\/?$/;
const missingEnv = !supabaseUrl || !supabaseAnonKey;
const invalidUrl = supabaseUrl && !urlPattern.test(supabaseUrl);

if (missingEnv || invalidUrl) {
  console.error('⚠️  Missing or invalid Supabase env vars.');
  if (!supabaseUrl) console.error('  - VITE_SUPABASE_URL is not set');
  if (!supabaseAnonKey) console.error('  - VITE_SUPABASE_ANON_KEY is not set');
  if (invalidUrl) console.error(`  - VITE_SUPABASE_URL looks invalid: ${supabaseUrl}`);
  console.error('  - Update .env with the correct Supabase project URL and anon key, then restart the dev server.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
