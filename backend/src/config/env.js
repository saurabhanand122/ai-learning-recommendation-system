import dotenv from 'dotenv';
dotenv.config();

export const PORT = process.env.PORT || 5000;
export const SUPABASE_URL = process.env.SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
export const CLERK_PUBLISHABLE_KEY = process.env.CLERK_PUBLISHABLE_KEY || '';
export const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY || '';
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

// Quick check to warn about missing keys
const missingKeys = [];
if (!SUPABASE_URL || SUPABASE_URL.includes('placeholder')) missingKeys.push('SUPABASE_URL');
if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.includes('placeholder')) missingKeys.push('SUPABASE_ANON_KEY');
if (!CLERK_SECRET_KEY || CLERK_SECRET_KEY.includes('placeholder')) missingKeys.push('CLERK_SECRET_KEY');
if (!OPENAI_API_KEY || OPENAI_API_KEY.includes('placeholder')) missingKeys.push('OPENAI_API_KEY');
if (!GEMINI_API_KEY || GEMINI_API_KEY.includes('placeholder')) missingKeys.push('GEMINI_API_KEY');

if (missingKeys.length > 0) {
  console.warn(`[WARN] The following environment variables are missing or use placeholders: ${missingKeys.join(', ')}. Some AI and DB features might not work properly.`);
}
