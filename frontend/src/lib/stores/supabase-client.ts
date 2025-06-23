import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Ensure your environment variables are set up correctly
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Debug logging for production
console.log('Supabase Environment Check:', {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  url: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'undefined',
  environment: process.env.NODE_ENV
})

// Create a mock client for development when env vars are not set
const createAppClient = (): SupabaseClient => {
  console.warn('🚨 Using Supabase MOCK client - authentication will not work!')
  return {
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signInWithPassword: () => Promise.resolve({ 
        data: { user: null, session: null }, 
        error: { message: 'Supabase not configured - using demo mode', name: 'AuthError', status: 400 }
      }),
      signUp: () => Promise.resolve({ 
        data: { user: null, session: null }, 
        error: { message: 'Supabase not configured - using demo mode', name: 'AuthError', status: 400 }
      }),
      signOut: () => Promise.resolve({ error: null }),
      signInWithOAuth: () => Promise.resolve({ 
        data: { provider: null, url: null }, 
        error: { message: 'Supabase not configured - using demo mode', name: 'AuthError', status: 400 }
      }),
      resetPasswordForEmail: () => Promise.resolve({ 
        data: {}, 
        error: { message: 'Supabase not configured - using demo mode', name: 'AuthError', status: 400 }
      }),
      resend: () => Promise.resolve({ 
        error: { message: 'Supabase not configured - using demo mode', name: 'AuthError', status: 400 }
      }),
      onAuthStateChange: () => ({ data: { subscription: null }, error: null }),
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
    : createAppClient()

console.log('Supabase client created:', supabase ? 'Success' : 'Failed')