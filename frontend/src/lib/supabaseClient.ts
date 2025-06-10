import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Ensure your environment variables are set up correctly
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Create a mock client for development when env vars are not set
const createMockClient = (): SupabaseClient => {
  return {
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    },
    from: () => ({
      select: () => ({ data: [], error: null }),
      insert: () => ({ data: null, error: new Error('Supabase not configured') }),
      update: () => ({ data: null, error: new Error('Supabase not configured') }),
      delete: () => ({ data: null, error: new Error('Supabase not configured') }),
    }),
    rpc: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
  } as any
}

// Create a single Supabase client instance
export const supabase: SupabaseClient = 
  supabaseUrl && supabaseAnonKey 
    ? createClient(supabaseUrl, supabaseAnonKey)
    : createMockClient()