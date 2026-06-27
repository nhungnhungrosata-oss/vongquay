import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://updfdsgidfhfluiycwaz.supabase.co';

const removeWrappingQuotes = (value: string) => {
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
};

const normalizeSupabaseUrl = (rawUrl: string) => {
  const cleaned = removeWrappingQuotes(rawUrl || DEFAULT_SUPABASE_URL);

  try {
    const parsed = new URL(cleaned);
    parsed.pathname = '';
    parsed.search = '';
    parsed.hash = '';
    return parsed.toString().endsWith('/') ? parsed.toString().slice(0, -1) : parsed.toString();
  } catch (error) {
    console.warn('Invalid VITE_SUPABASE_URL, fallback to default Supabase URL:', error);
    return DEFAULT_SUPABASE_URL;
  }
};

const supabaseUrl = normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL);
const supabaseKey = removeWrappingQuotes(
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  ''
);

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : null;
