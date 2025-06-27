import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { buildApiUrl } from '@/lib/config/api';
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { v4 as uuidv4 } from 'uuid'

// Create Supabase client for server-side auth
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getAuthToken(request: NextRequest) {
  // Get the authorization header
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.substring(7); // Remove 'Bearer ' prefix
}

export async function GET(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: () => cookies() }
  )
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const organizationId = searchParams.get('organization_id')

  if (!organizationId) {
    return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
  }

  try {
    // Fetch businesses which represent applications in this context
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({ businesses: data })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    console.error('Error fetching applications:', errorMessage)
    return NextResponse.json({ error: 'Internal server error', details: errorMessage }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { organization_id, business_name, website_url } = await request.json()

  if (!organization_id || !business_name) {
    return NextResponse.json({ error: 'Organization ID and business name are required' }, { status: 400 })
  }

  try {
    // 1. Create the business record
    const businessId = uuidv4()
    const { data: businessData, error: businessError } = await supabase
      .from('businesses')
      .insert({
        id: businessId,
        user_id: user.id,
        organization_id: organization_id,
        name: business_name,
        website: website_url,
        status: 'pending', // Applications start as pending
      })
      .select()
      .single()

    if (businessError) throw new Error(`Failed to create business: ${businessError.message}`)

    // 2. Create the application record
    const { data: appData, error: appError } = await supabase
      .from('applications')
      .insert({
        id: uuidv4(),
        user_id: user.id,
        organization_id: organization_id,
        business_id: businessId,
        status: 'submitted',
        application_data: {
          business_name,
          website_url,
        },
      })
      .select()
      .single()

    if (appError) throw new Error(`Failed to create application record: ${appError.message}`)

    return NextResponse.json({ business: businessData, application: appData })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    console.error('Application creation error:', errorMessage)
    return NextResponse.json({ error: 'Internal server error', details: errorMessage }, { status: 500 })
  }
} 