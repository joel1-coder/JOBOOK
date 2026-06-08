import { createClient } from '@supabase/supabase-js';
import { mockSupabase } from './mockSupabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if we should use the mock client
const useMock = 
  import.meta.env.VITE_USE_MOCK_SUPABASE === 'true' || 
  !supabaseUrl || 
  supabaseUrl.includes('your-supabase-project-id') || 
  supabaseUrl.includes('qbuwdrshaucqddzajojw');

if (useMock) {
  console.log('🔌 [JOBOOK] Using Mock Local Supabase Client');
} else if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️  Missing Supabase env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env');
}

export const supabase = useMock ? mockSupabase : createClient(supabaseUrl, supabaseAnonKey);

