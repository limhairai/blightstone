import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function getAuth(request: NextRequest) {
    const cookieStore = cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
            },
        }
    )
    const { data: { session } } = await supabase.auth.getSession()
    return session
}

export async function GET(request: NextRequest) {
  const session = await getAuth(request)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Check backend connectivity
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/dolphin-assets/all-assets`
    console.log('🔍 Debug: Calling backend URL:', backendUrl)
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    })

    console.log('🔍 Debug: Backend response status:', response.status)
    console.log('🔍 Debug: Backend response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.log('🔍 Debug: Backend error response:', errorText)
      return NextResponse.json({ 
        error: 'Backend error', 
        status: response.status,
        details: errorText 
      }, { status: response.status })
    }

    const data = await response.json()
    console.log('🔍 Debug: Backend response data type:', typeof data)
    console.log('🔍 Debug: Backend response keys:', Object.keys(data))
    
    if (data.assets) {
      console.log('🔍 Debug: Assets array length:', data.assets.length)
      console.log('🔍 Debug: Asset types:', data.assets.map((a: any) => a.type))
      console.log('🔍 Debug: Business managers:', data.assets.filter((a: any) => a.type === 'business_manager').length)
      
      // Show first few assets for debugging
      const bmAssets = data.assets.filter((a: any) => a.type === 'business_manager').slice(0, 3)
      console.log('🔍 Debug: Sample BM assets:', bmAssets)
    }

    return NextResponse.json({
      debug: true,
      backend_url: backendUrl,
      response_status: response.status,
      data_type: typeof data,
      data_keys: Object.keys(data),
      assets_count: data.assets ? data.assets.length : 0,
      business_managers_count: data.assets ? data.assets.filter((a: any) => a.type === 'business_manager').length : 0,
      sample_data: data.assets ? data.assets.slice(0, 2) : null,
      raw_data: data
    })

  } catch (error) {
    console.error('🔍 Debug: Error:', error)
    return NextResponse.json(
      { error: 'Debug error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 