import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Ensure your environment variables are set up correctly
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set in environment variables.")
}
if (!supabaseAnonKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not set in environment variables.")
}

// Create a single Supabase client instance
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey) 