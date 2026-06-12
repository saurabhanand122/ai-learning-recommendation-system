import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './env.js';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('[ERROR] Supabase credentials not found. Database client is uninitialized.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
