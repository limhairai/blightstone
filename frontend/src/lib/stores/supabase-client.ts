import { createBrowserClient } from '@supabase/ssr'
import { SupabaseClient } from '@supabase/supabase-js'

// This function creates a new Supabase client for the browser.
// It's safe to be used in client components.
export function createSupabaseBrowserClient(): SupabaseClient {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// A singleton instance of the Supabase client for the browser.
// This is safe to be used in client components and will be created only once.
const supabase: SupabaseClient = createSupabaseBrowserClient()

export { supabase }