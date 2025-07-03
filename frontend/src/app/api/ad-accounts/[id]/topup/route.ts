import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { buildApiUrl, createAuthHeaders } from '../../../../../lib/api-utils'

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
    return { session, user: session?.user }
}

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const { session } = await getAuth(request)
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await request.json()
        
        const backendUrl = buildApiUrl(`/api/ad-accounts/${params.id}/topup`)
        
        console.log('🔍 Ad Account Topup API: Calling backend URL:', backendUrl)

        const response = await fetch(backendUrl, {
            method: 'POST',
            headers: createAuthHeaders(session.access_token),
            body: JSON.stringify(body),
        })

        console.log('🔍 Ad Account Topup API: Backend response status:', response.status)

        if (!response.ok) {
            const errorData = await response.json()
            console.error('🔍 Ad Account Topup API: Backend error:', errorData)
            return NextResponse.json(errorData, { status: response.status })
        }

        const data = await response.json()
        return NextResponse.json(data)

    } catch (error) {
        console.error('Ad account topup API error:', error)
        return NextResponse.json(
            { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
} 