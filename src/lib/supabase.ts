import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create fallback client for when Supabase is not configured
const createFallbackClient = () => ({
  from: () => ({
    select: () => Promise.resolve({ data: [], error: null }),
    insert: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
    update: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
    delete: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
    eq: () => ({ 
      select: () => Promise.resolve({ data: [], error: null }),
      single: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } })
    }),
    order: () => ({ 
      select: () => Promise.resolve({ data: [], error: null }) 
    }),
    single: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } })
  }),
  rpc: () => Promise.resolve({ error: null })
});

// Initialize client
let supabaseClient: any;
let isConfigured = false;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables not found. Using fallback mode.');
  console.warn('Please ensure your Supabase integration is properly connected.');
  supabaseClient = createFallbackClient();
  isConfigured = false;
} else {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  isConfigured = true;
}

export const supabase = supabaseClient;

// Set current tenant for multi-tenancy
export const setCurrentTenant = async (tenantId: string) => {
  if (!isConfigured) {
    console.warn('Supabase not configured, skipping tenant setup');
    return;
  }
  
  const { error } = await supabase.rpc('set_config', {
    setting_name: 'app.current_tenant',
    setting_value: tenantId,
    is_local: false
  });
  if (error) console.error('Error setting tenant:', error);
};

// Default tenant for demo
export const DEFAULT_TENANT_ID = '550e8400-e29b-41d4-a716-446655440000';

// Helper to check if Supabase is properly configured
export const isSupabaseConfigured = () => isConfigured;