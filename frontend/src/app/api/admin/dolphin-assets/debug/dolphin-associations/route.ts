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
    // Call the backend diagnostic endpoint
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/dolphin-assets/debug/dolphin-associations`
    console.log('🔍 Diagnostic: Calling backend URL:', backendUrl)
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    })

    console.log('🔍 Diagnostic: Backend response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.log('🔍 Diagnostic: Backend error response:', errorText)
      return NextResponse.json({ 
        error: 'Backend diagnostic failed', 
        status: response.status,
        details: errorText 
      }, { status: response.status })
    }

    const diagnosis = await response.json()
    console.log('🔍 Diagnostic: Received diagnosis data')
    
    return NextResponse.json(diagnosis)

  } catch (error) {
    console.error('🔍 Diagnostic: Error:', error)
    return NextResponse.json(
      { error: 'Diagnostic error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 