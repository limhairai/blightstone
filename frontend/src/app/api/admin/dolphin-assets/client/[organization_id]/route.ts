import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { buildApiUrl, createAuthHeaders } from '../../../../../../lib/api-utils'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

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

export async function GET(
    request: NextRequest,
    { params }: { params: { organization_id: string } }
) {
    const { session } = await getAuth(request)
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { searchParams } = new URL(request.url)
        const bmId = searchParams.get('bm_id')
        const assetType = searchParams.get('type')
        
        const backendUrl = buildApiUrl(`/api/dolphin-assets/client/${params.organization_id}`)
        const urlWithParams = new URL(backendUrl)
        if (bmId) {
            urlWithParams.searchParams.set('bm_id', bmId)
        }
        if (assetType) {
            urlWithParams.searchParams.set('type', assetType)
        }

        console.log('🔍 Client Assets API: Calling backend URL:', urlWithParams.toString())

        const response = await fetch(urlWithParams.toString(), {
            method: 'GET',
            headers: createAuthHeaders(session.access_token),
        })

        console.log('🔍 Client Assets API: Backend response status:', response.status)

        if (!response.ok) {
            const errorData = await response.json()
            console.log('🔍 Client Assets API: Backend error:', errorData)
            return NextResponse.json(errorData, { status: response.status })
        }

        const data = await response.json()
        console.log('🔍 Client Assets API: Backend data:', data)
        return NextResponse.json(data)

    } catch (error) {
        console.error('Client assets API error:', error)
        return NextResponse.json(
            { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
} 