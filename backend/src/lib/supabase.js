import { createClient } from '@supabase/supabase-js';
import { memory } from './store/memory.js';

const url = process.env.SUPABASE_URL?.trim();
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
  process.env.SUPABASE_SECRET_KEY?.trim();

function isPlaceholder(value) {
  if (!value) return true;
  const v = value.toLowerCase();
  return (
    v.includes('tu_') ||
    v.includes('your-') ||
    v.includes('placeholder') ||
    v === 'changeme'
  );
}

export const useMemory = !url || isPlaceholder(url) || isPlaceholder(serviceKey);

export const supabase = useMemory
  ? null
  : createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

export function getStore() {
  return useMemory ? memory : null;
}

export function getSupabaseStatus() {
  return {
    connected: !useMemory,
    url: url || null,
    project_ref: process.env.SUPABASE_PROJECT_REF || null,
    mode: useMemory ? 'memory' : 'supabase'
  };
}
